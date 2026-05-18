// poll.controller.ts
import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { pollServices } from "./poll.service";
import { JwtPayload } from "../../interface/global";

const createPoll = catchAsync(async (req: Request, res: Response) => {
  const result = await pollServices.createPoll(
    req.user as JwtPayload,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Poll created successfully.",
    data: result,
  });
});

const getAllPolls = catchAsync(async (req: Request, res: Response) => {
  const result = await pollServices.getAllPolls(
    req.user as JwtPayload,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Polls fetched successfully.",
    meta: result.meta,
    data: result.result,
  });
});

const answerPoll = catchAsync(async (req: Request, res: Response) => {
  const result = await pollServices.answerPoll(
    req.user as JwtPayload,
    req.params.pollId,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Response submitted successfully.",
    data: result,
  });
});

const getPollAnswers = catchAsync(async (req: Request, res: Response) => {
  const result = await pollServices.getPollAnswers(
    req.user as JwtPayload,
    req.params.pollId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Poll answers fetched successfully.",
    data: result,
  });
});

const getPollResults = catchAsync(async (req: Request, res: Response) => {
  const result = await pollServices.getPollResults(
    req.user as JwtPayload,
    req.params.pollId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Poll answers fetched successfully.",
    data: result,
  });
});

const updatePoll = catchAsync(async (req: Request, res: Response) => {
  const result = await pollServices.updatePoll(
    req.user as JwtPayload,
    req.params.pollId,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Poll updated successfully.",
    data: result,
  });
});

const deletePoll = catchAsync(async (req: Request, res: Response) => {
  const result = await pollServices.deletePoll(
    req.user as JwtPayload,
    req.params.pollId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Poll deleted successfully.",
    data: result,
  });
});

export const pollControllers = {
  createPoll,
  getAllPolls,
  answerPoll,
  getPollAnswers,
  getPollResults,
  updatePoll,
  deletePoll,
};
