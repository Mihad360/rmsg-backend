/* eslint-disable @typescript-eslint/no-explicit-any */
// poll.services.ts
import HttpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import AppError from "../../erros/AppError";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../User/user.model";
import { IPoll } from "./poll.interface";
import { PollAnswerModel, PollModel } from "./poll.model";
import QueryBuilder from "../../../builder/QueryBuilder";

const createPoll = async (user: JwtPayload, payload: IPoll) => {
  const existingUser = await UserModel.findById(user.user).lean();
  if (!existingUser) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found.");
  }

  if (payload.answerType === "selector") {
    if (!payload.options || payload.options.length < 2) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Selector poll must have at least 2 options.",
      );
    }
  }

  if (payload.answerType === "write-in") {
    payload.options = [];
  }

  const poll = await PollModel.create({
    ...payload,
    createdBy: user.user,
    totalResponses: 0,
  });

  return poll;
};

const getAllPolls = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const existingUser = await UserModel.findById(user.user).lean();
  if (!existingUser) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found.");
  }

  const baseQuery = PollModel.find()
    .populate("createdBy", "_id name profileImage")
    .sort({ createdAt: -1 });

  const polls = new QueryBuilder(baseQuery, query)
    .search(["title", "tagline"])
    .filter()
    .paginate()
    .fields();

  const meta = await polls.countTotal();
  const result = await polls.modelQuery;

  return { meta, result };
};

const answerPoll = async (
  user: JwtPayload,
  pollId: string,
  payload: { optionId?: string; answer?: string },
) => {
  // ── 1. Validate user & poll exist ────────────────────────────────────────
  const [existingUser, poll] = await Promise.all([
    UserModel.findById(user.user).lean(),
    PollModel.findById(pollId).lean(),
  ]);

  if (!existingUser) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found.");
  }
  if (!poll) {
    throw new AppError(HttpStatus.NOT_FOUND, "Poll not found.");
  }

  // ── 2. Payload validation per answerType ─────────────────────────────────
  if (poll.answerType === "selector" && !payload.optionId) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Option is required.");
  }
  if (poll.answerType === "write-in" && !payload.answer?.trim()) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Answer is required.");
  }

  // ── 3. Validate optionId actually belongs to this poll ───────────────────
  if (poll.answerType === "selector" && payload.optionId) {
    const optionExists = poll.options?.some(
      (opt) => opt._id!.toString() === payload.optionId,
    );

    if (!optionExists) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "The selected option does not belong to this poll.",
      );
    }
  }

  // ── 4. Duplicate vote check ───────────────────────────────────────────────
  const alreadyAnswered = await PollAnswerModel.findOne({
    poll: new Types.ObjectId(pollId),
    user: new Types.ObjectId(user.user),
  }).lean();

  if (alreadyAnswered) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "You have already responded to this poll.",
    );
  }

  // ── 5. Transactional write ────────────────────────────────────────────────
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    await PollAnswerModel.create(
      [
        {
          poll: new Types.ObjectId(pollId),
          user: new Types.ObjectId(user.user),
          ...(payload.optionId && {
            optionId: new Types.ObjectId(payload.optionId),
          }),
          ...(payload.answer && { answer: payload.answer.trim() }),
        },
      ],
      { session },
    );

    if (poll.answerType === "selector" && payload.optionId) {
      // ✅ Cast to ObjectId so _id comparison never silently mismatches
      const result = await PollModel.updateOne(
        {
          _id: new Types.ObjectId(pollId),
          "options._id": new Types.ObjectId(payload.optionId),
        },
        { $inc: { "options.$.count": 1 } },
        { session },
      );

      // ✅ If nothing was modified, the option lookup failed — abort early
      if (result.modifiedCount === 0) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Failed to record vote — option not found in poll.",
        );
      }
    }

    await PollModel.findByIdAndUpdate(
      new Types.ObjectId(pollId),
      { $inc: { totalResponses: 1 } },
      { session },
    );

    await session.commitTransaction();
    return { message: "Response submitted successfully." };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getPollAnswers = async (user: JwtPayload, pollId: string) => {
  const existingUser = await UserModel.findById(user.user).lean();
  if (!existingUser) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found.");
  }

  const poll = await PollModel.findById(pollId)
    .populate("createdBy", "_id name profileImage")
    .lean();
  if (!poll) {
    throw new AppError(HttpStatus.NOT_FOUND, "Poll not found.");
  }

  // selector branch
  if (poll.answerType === "selector") {
    const [userAnswer, answerCounts] = await Promise.all([
      PollAnswerModel.findOne({ poll: pollId, user: user.user }).lean(),
      PollAnswerModel.aggregate([
        { $match: { poll: new Types.ObjectId(pollId) } },
        { $group: { _id: "$optionId", count: { $sum: 1 } } },
      ]),
    ]);

    const countMap = new Map(
      answerCounts.map((a) => [a._id?.toString(), a.count]),
    );

    const options = poll.options?.map((opt) => {
      const count = countMap.get(opt._id!.toString()) ?? 0;
      const total = poll.totalResponses ?? 0;
      return {
        _id: opt._id,
        text: opt.text,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });

    return {
      _id: poll._id,
      title: poll.title,
      tagline: poll.tagline,
      answerType: poll.answerType,
      totalResponses: poll.totalResponses ?? 0,
      options,
      answered: !!userAnswer,
      myAnswer: userAnswer ? { optionId: userAnswer.optionId } : null,
    };
  }

  // write-in branch – only the user's own answer as a string
  const userAnswer = await PollAnswerModel.findOne({
    poll: pollId,
    user: user.user,
  }).lean();

  return {
    _id: poll._id,
    title: poll.title,
    tagline: poll.tagline,
    answerType: poll.answerType,
    totalResponses: poll.totalResponses ?? 0,
    answered: !!userAnswer,
    answer: userAnswer ? userAnswer.answer : null, // plain string, not an object
  };
};

// poll.services.ts - add this new function

const getPollResults = async (user: JwtPayload, pollId: string) => {
  const existingUser = await UserModel.findById(user.user).lean();
  if (!existingUser) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found.");
  }

  const poll = await PollModel.findById(pollId)
    .populate("createdBy", "_id name profileImage")
    .lean();

  if (!poll) {
    throw new AppError(HttpStatus.NOT_FOUND, "Poll not found.");
  }

  // Check if requesting user is the poll creator
  if (poll.createdBy._id?.toString() !== user.user) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only the poll creator can view detailed results.",
    );
  }

  // For selector type - return votes grouped by option with user details
  if (poll.answerType === "selector") {
    // Get all answers with user details populated
    const answers = await PollAnswerModel.find({ poll: pollId }).lean();

    // Get vote counts per option
    const answerCounts = await PollAnswerModel.aggregate([
      { $match: { poll: new Types.ObjectId(pollId) } },
      { $group: { _id: "$optionId", count: { $sum: 1 } } },
    ]);

    const countMap = new Map(
      answerCounts.map((a) => [a._id?.toString(), a.count]),
    );

    // Build options with users who voted for each
    const optionsWithUsers = poll.options?.map((opt) => {
      const count = countMap.get(opt._id!.toString()) ?? 0;
      const total = poll.totalResponses ?? 0;
      const users = answers
        .filter((a) => a.optionId?.toString() === opt._id!.toString())
        .map((a) => a.user);

      return {
        _id: opt._id,
        text: opt.text,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        users, // Array of user objects who voted for this option
      };
    });

    return {
      _id: poll._id,
      title: poll.title,
      tagline: poll.tagline,
      answerType: poll.answerType,
      totalResponses: poll.totalResponses ?? 0,
      options: optionsWithUsers,
      createdAt: poll.createdAt,
    };
  }

  // For write-in type - return all answers as text with user details
  const answers = await PollAnswerModel.find({ poll: pollId })
    .populate("user", "_id name profileImage email")
    .select("answer user createdAt")
    .lean();

  return {
    _id: poll._id,
    title: poll.title,
    tagline: poll.tagline,
    answerType: poll.answerType,
    totalResponses: poll.totalResponses ?? 0,
    answers: answers.map((a) => ({
      answer: a.answer,
      user: a.user,
      submittedAt: a.createdAt,
    })),
    createdAt: poll.createdAt,
  };
};

const updatePoll = async (
  user: JwtPayload,
  pollId: string,
  updates: {
    title?: string;
    tagline?: string;
    options?: Array<{ _id: string; text: string }>; // Must have _id to identify which option to update
    newOptions?: string[]; // New options to add
    removeOptionIds?: string[]; // Options to remove
  },
) => {
  const existingUser = await UserModel.findById(user.user).lean();
  if (!existingUser) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found.");
  }

  const poll = await PollModel.findById(pollId).lean();
  if (!poll) {
    throw new AppError(HttpStatus.NOT_FOUND, "Poll not found.");
  }

  // Check ownership
  if (poll.createdBy.toString() !== user.user) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "You can only update your own polls.",
    );
  }

  // Cannot modify options if there are existing responses
  if (
    poll.totalResponses &&
    poll.totalResponses > 0 &&
    (updates.options || updates.newOptions || updates.removeOptionIds)
  ) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Cannot modify poll options after receiving responses.",
    );
  }

  const updateData: any = {};

  // Simple title and tagline update
  if (updates.title) updateData.title = updates.title;
  if (updates.tagline !== undefined) updateData.tagline = updates.tagline;

  // Handle options for selector polls
  if (poll.answerType === "selector") {
    let currentOptions = [...(poll.options || [])];

    // 1. Update existing options (by _id)
    if (updates.options && updates.options.length > 0) {
      for (const updatedOpt of updates.options) {
        const optionIndex = currentOptions.findIndex(
          (opt) => opt._id!.toString() === updatedOpt._id,
        );
        if (optionIndex !== -1) {
          currentOptions[optionIndex].text = updatedOpt.text;
        } else {
          throw new AppError(
            HttpStatus.BAD_REQUEST,
            `Option with id ${updatedOpt._id} not found.`,
          );
        }
      }
    }

    // 2. Add new options
    if (updates.newOptions && updates.newOptions.length > 0) {
      for (const newOptText of updates.newOptions) {
        if (newOptText.trim()) {
          currentOptions.push({ text: newOptText.trim(), count: 0 });
        }
      }
    }

    // 3. Remove options
    if (updates.removeOptionIds && updates.removeOptionIds.length > 0) {
      currentOptions = currentOptions.filter(
        (opt) => !updates.removeOptionIds?.includes(opt._id!.toString()),
      );
    }

    // Validate minimum 2 options
    if (currentOptions.length < 2) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Selector poll must have at least 2 options.",
      );
    }

    updateData.options = currentOptions;
  }

  const updatedPoll = await PollModel.findByIdAndUpdate(pollId, updateData, {
    new: true,
    runValidators: true,
  }).populate("createdBy", "_id name profileImage");

  return updatedPoll;
};

const deletePoll = async (user: JwtPayload, pollId: string) => {
  const existingUser = await UserModel.findById(user.user).lean();
  if (!existingUser) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found.");
  }

  const poll = await PollModel.findById(pollId).lean();
  if (!poll) {
    throw new AppError(HttpStatus.NOT_FOUND, "Poll not found.");
  }

  // Check ownership
  if (poll.createdBy.toString() !== user.user) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "You can only delete your own polls.",
    );
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Delete all answers related to this poll
    await PollAnswerModel.deleteMany({ poll: pollId }, { session });

    // Delete the poll
    await PollModel.findByIdAndDelete(pollId, { session });

    await session.commitTransaction();

    return { message: "Poll and all associated answers deleted successfully." };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const pollServices = {
  createPoll,
  getAllPolls,
  answerPoll,
  getPollAnswers,
  getPollResults,
  updatePoll,
  deletePoll,
};
