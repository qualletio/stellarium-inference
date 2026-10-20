# stellarium-inference

Stellarium Resources for routing AI inference.

## Modules

### Claude

#### Sonnet

```
request ClaudeRequest {

    const sonnet: sh.stellarium.inference.claude.Sonnet
    const response = sonnet.message("Hello, what is your name?", maxTokens: 2000)

    return response.value
}
```
