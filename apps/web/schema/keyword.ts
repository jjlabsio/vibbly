import z from "zod";

export const KeywordSchema = z.object({
  id: z.string().min(1),
  text: z.string().trim().min(1, { error: "textError" }),
  userId: z.string().min(1),
  createdAt: z.string(),
});

export const CreateKeywordSchema = KeywordSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
});
export const EditKeywordSchema = KeywordSchema.omit({
  userId: true,
  createdAt: true,
});
