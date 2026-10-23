import Anthropic from "@anthropic-ai/sdk";
import { ResourceFunctionCallParameter } from "requestscript";
import type { StellariumResource } from "stellarium-ts";

export function sonnet(baseUrl: string): StellariumResource {
  return {
    id: 1,
    baseUrl,
    metadata: {},
    path: "sh.stellarium.inference.claude",
    name: "Sonnet",
    description: "A collection of functions for Claude Sonnet 5.5",
    website: "https://github.com/qualletio/stellarium-inference",
    functions: [
      {
        name: "message",
        kind: "inference",
        parameters: [
          { 
            name: "prompt", 
            type: "string", 
            description: "The prompt to generate text from." 
          },
          {
            name: "maxTokens",
            type: "int32",
            description: "The maximum number of tokens to generate.",
          }
        ],
        returnType: "string",
        description: "Prompt the model to generate text.",
        exec: async (args) => {
          const prompt = args.find((arg) => arg.name === "prompt")?.value;
          const maxTokens = args.find((arg) => arg.name === "maxTokens")?.value;
          
          const client = new Anthropic();

          const message = await client.messages.create({
              max_tokens: maxTokens as number,
              messages: [{ role: "user", content: prompt as string }],
              model: "claude-sonnet-5-5"
          });

          let responseText = "";

          for (const block of message.content) {
            if (block.type === "text") {
              responseText += block.text;
            }
          }

          return { value: responseText, usage: { inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens } };
        },
        estimateInputTokens: async (args: ResourceFunctionCallParameter[]) => {
          const prompt = args.find((arg) => arg.name === "prompt")?.value as string;

          const client = new Anthropic();

          const messageTokensCount = await client.messages.countTokens({
            messages: [{ content: prompt, role: "user" }],
            model: "claude-sonnet-5-5"
          });

          return messageTokensCount.input_tokens;
        },
        paymentManifest: {
          // $2.50 per million tokens
          inputCostMicroUsdPerMillionTokens: 2500000,
          // $10.50 per million tokens
          outputCostMicroUsdPerMillionTokens: 10500000,
        },
      },
    ],
  }
}
