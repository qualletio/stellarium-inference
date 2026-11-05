import { ResourceFunctionCallParameter } from "requestscript";
import { defineStruct, type StellariumResource } from "stellarium-ts";
import { choice, TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient({ defaultModel: "jev-latest" }); // Reads TYPESAFE_API_KEY.

// Typesafe has no token-counting API. This estimate only sets the voucher cap, and the
// charge comes from the real usage, so it errs high.
const CHARS_PER_TOKEN = 3;
const REQUEST_OVERHEAD_TOKENS = 200; // Calibrate against response.usage.input_tokens.

export const Choice = defineStruct("sh.stellarium.inference.typesafe.Choice", 1, {
  name: "string",
  value: "string",
});

export const JevChoiceInput = defineStruct("sh.stellarium.inference.typesafe.JevChoiceInput", 1, {
  prompt: "string",
  question: "string",
  choices: `[]${Choice.type}`,
});

function estimateChoiceInputTokens(args: ResourceFunctionCallParameter[]): number {
  const prompt = args.find((arg) => arg.name === "prompt")?.value;
  const question = args.find((arg) => arg.name === "question")?.value;
  const choices = args.find((arg) => arg.name === "choices")?.value;

  const text = JSON.stringify({ state: prompt, question, choices }) ?? "";
  return Math.ceil(text.length / CHARS_PER_TOKEN) + REQUEST_OVERHEAD_TOKENS;
}

export function jev(baseUrl: string): StellariumResource {
  return {
    id: 1,
    baseUrl,
    metadata: {},
    path: "sh.stellarium.inference.typesafe",
    name: "Jev",
    description: "A collection of functions for Jev",
    website: "https://github.com/qualletio/stellarium-inference",
    functions: [
      {
        name: "choice",
        kind: "inference",
        parameters: [
          {
            name: "prompt",
            type: "string",
            description: "The context to give the model to help it answer the question."
          },
          {
            name: "question",
            type: "string",
            description: "The question to ask the model for the choice.",
          },
          {
            name: "choices",
            type: `[]${Choice.type}`,
            description: "The choices to choose from. Must include a name and value property.",
          },
          {
            name: "maxTokens",
            type: "int32",
            description: "This argument is ignored for this model.",
          }
        ],
        returnType: JevChoiceInput.type,
        description: "Prompt the model to choose from a list of choices.",
        exec: async (args) => {


          const prompt = args.find((arg) => arg.name === "prompt")?.value as string;
          const question = args.find((arg) => arg.name === "question")?.value as string;
          const choices = args.find((arg) => arg.name === "choices")?.value as { name: string, value: string }[];

          const response = await client.systemOne({
            state: prompt,
            questions: {
              question: choice(question, {
                ...choices.reduce((acc, choice) => {
                  acc[choice.name] = choice.value;
                  return acc;
                }, {} as Record<string, string>),
              }),
            },
          });

          return {
            value: {
              choice: response.answers.question.choice,
              confidence: response.answers.question.confidence
            },
            usage: {
              // Typesafe may not report usage; fall back to the estimate so the call still settles.
              inputTokens: response.usage.input_tokens ?? estimateChoiceInputTokens(args),
              outputTokens: response.usage.output_tokens ?? 0
            }
          };
        },
        estimateInputTokens: async (args: ResourceFunctionCallParameter[]) => estimateChoiceInputTokens(args),
        paymentManifest: {
          // $0.042 per million tokens
          inputCostMicroUsdPerMillionTokens: 43000,
          // $0 per million tokens
          outputCostMicroUsdPerMillionTokens: 0,
        },
      },
    ],
  }
}
