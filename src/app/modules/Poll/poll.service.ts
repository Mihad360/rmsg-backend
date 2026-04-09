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
  const existingUser = await UserModel.findById(user.user).lean();
  if (!existingUser) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found.");
  }

  const poll = await PollModel.findById(pollId).lean();
  if (!poll) {
    throw new AppError(HttpStatus.NOT_FOUND, "Poll not found.");
  }

  // duplicate vote check
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

  if (poll.answerType === "selector" && !payload.optionId) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Option is required.");
  }

  if (poll.answerType === "write-in" && !payload.answer) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Answer is required.");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    await PollAnswerModel.create(
      [
        {
          poll: pollId,
          user: user.user,
          ...(payload.optionId && {
            optionId: new Types.ObjectId(payload.optionId),
          }),
          ...(payload.answer && { answer: payload.answer }),
        },
      ],
      { session },
    );

    if (poll.answerType === "selector" && payload.optionId) {
      await PollModel.updateOne(
        {
          _id: pollId,
          "options._id": payload.optionId,
        },
        {
          $inc: { "options.$.count": 1 },
        },
        { session },
      );
    }

    await PollModel.findByIdAndUpdate(
      pollId,
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
    // get user answer
    const userAnswer = await PollAnswerModel.findOne({
      poll: new Types.ObjectId(pollId),
      user: new Types.ObjectId(user.user),
    }).lean();

    // aggregate counts
    const answerCounts = await PollAnswerModel.aggregate([
      { $match: { poll: new Types.ObjectId(pollId) } },
      { $group: { _id: "$optionId", count: { $sum: 1 } } },
    ]);

    const countMap = new Map(
      answerCounts.map((a) => [a._id?.toString(), a.count]),
    );

    const options = poll.options?.map((opt) => {
      const count = countMap.get(opt._id!.toString()) || 0;

      return {
        _id: opt._id,
        text: opt.text,
        count,
        percentage:
          (poll.totalResponses ?? 0) > 0
            ? Math.round((count / (poll.totalResponses ?? 0)) * 100)
            : 0,
      };
    });

    // ✅ FINAL RESPONSE WITH POLL DATA
    return {
      _id: poll._id,
      title: poll.title,
      tagline: poll.tagline,
      createdBy: poll.createdBy,
      answerType: poll.answerType,
      totalResponses: poll.totalResponses,

      options,

      myAnswer: userAnswer
        ? {
            optionId: userAnswer.optionId,
          }
        : null,
    };
  } else {
    // write-in — paginated individual answers
    const baseQuery = PollAnswerModel.find({
      poll: new Types.ObjectId(pollId),
    })
      .populate("poll", "_id title tagline totalResponses createdAt")
      .populate("user", "_id name profileImage");

    const answers = new QueryBuilder(baseQuery, query).paginate().fields();

    const meta = await answers.countTotal();
    const result = await answers.modelQuery;

    return {
      answerType: "write-in",
      totalResponses: poll.totalResponses,
      meta,
      result,
    };
  }
};

export const pollServices = {
  createPoll,
  getAllPolls,
  answerPoll,
  getPollAnswers,
};
