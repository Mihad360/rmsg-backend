import { Schema, model } from "mongoose";
import { IPoll, IPollAnswer } from "./poll.interface";

const PollOptionSchema = new Schema({
  text: { type: String, required: true },
  count: { type: Number, default: 0 },
});

const PollSchema = new Schema<IPoll>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    tagline: String,
    answerType: {
      type: String,
      enum: ["selector", "write-in"],
      default: "selector",
    },
    options: [PollOptionSchema],
    totalResponses: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const PollModel = model<IPoll>("Poll", PollSchema);

// poll-answer.model.ts
const PollAnswerSchema = new Schema<IPollAnswer>(
  {
    poll: { type: Schema.Types.ObjectId, ref: "Poll", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    optionId: { type: Schema.Types.ObjectId, default: null },
    answer: { type: String, default: null },
  },
  { timestamps: true },
);

export const PollAnswerModel = model<IPollAnswer>(
  "PollAnswer",
  PollAnswerSchema,
);
