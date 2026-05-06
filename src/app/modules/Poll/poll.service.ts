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

const getPollAnswers = async (
  user: JwtPayload,
  pollId: string,
  query: Record<string, unknown>,
) => {
  const existingUser = await UserModel.findById(user.user).lean();
  if (!existingUser) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found.");
  }

  const poll = await PollModel.findById(pollId).lean();
  if (!poll) {
    throw new AppError(HttpStatus.NOT_FOUND, "Poll not found.");
  }

  if (poll.answerType === "selector") {
    // ✅ Run both queries in parallel — userAnswer will simply be null if not answered

    const [userAnswer, answerCounts] = await Promise.all([
      PollAnswerModel.findOne({
        poll: pollId,
        user: user.user,
      }).lean(),
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
    // console.log("userAnswer:", userAnswer);
    return {
      _id: poll._id,
      title: poll.title,
      tagline: poll.tagline,
      createdBy: poll.createdBy,
      answerType: poll.answerType,
      totalResponses: poll.totalResponses ?? 0,
      options,
      // ✅ null if not answered — never throws
      myAnswer: userAnswer ? { optionId: userAnswer.optionId } : null,
      answered: userAnswer ? true : false,
    };
  }

  // ── write-in branch ──────────────────────────────────────────────────────
  const baseQuery = PollAnswerModel.find({
    poll: new Types.ObjectId(pollId),
  })
    .populate("poll", "_id title tagline totalResponses createdAt")
    .populate("user", "_id name profileImage");

  const builder = new QueryBuilder(baseQuery, query).paginate().fields();

  const [meta, result] = await Promise.all([
    builder.countTotal(),
    builder.modelQuery,
  ]);

  return {
    _id: poll._id,
    title: poll.title,
    tagline: poll.tagline,
    createdBy: poll.createdBy,
    answerType: poll.answerType,
    totalResponses: poll.totalResponses ?? 0,
    // ✅ write-in has no concept of "my answer" — always null
    myAnswer: null,
    meta,
    result,
  };
};

export const pollServices = {
  createPoll,
  getAllPolls,
  answerPoll,
  getPollAnswers,
};
