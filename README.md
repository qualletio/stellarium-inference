# stellarium-inference

Stellarium-hosted model router for AI inference. No API Key needed. Pay in USDC.

Supported Models:

- Claude Sonnet
- More coming soon.

## Modules

### Claude

#### Sonnet

```
request ClaudeRequest {

    const sonnet: sh.stellarium.inference.claude.Sonnet
    const response = sonnet.message(prompt: "Hello, what is your name?", maxTokens: 2000)

    return response.value
}
```
