#!/usr/bin/env node
import { Box, render, Text } from 'ink'
import React from 'react'
import { InputProvider, initInput, inkRenderers, input } from 'react-imperative-prompt/ink'

// Initialize input system with ink renderers
initInput({
  renderers: inkRenderers,
  defaultRenderer: 'text',
})

interface UserProfile {
  name: string
  age: number
  email: string
  experience: string
  newsletter: boolean
}

const App: React.FC = () => {
  const [profile, setProfile] = React.useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const runPrompts = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Greeting
        console.clear()

        const name = await input.text({
          message: 'Welcome! What is your name?',
          defaultValue: 'Anonymous',
        })
        if (!name) throw new Error('Cancelled')

        const age = await input.number({
          message: `Hello ${name}! How old are you?`,
          min: 1,
          max: 120,
          defaultValue: 25,
        })
        if (age === null) throw new Error('Cancelled')

        const email = await input.text({
          message: 'What is your email address?',
          placeholder: 'user@example.com',
          validate: (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(value)) {
              return 'Please enter a valid email address'
            }
            return true
          },
        })
        if (!email) throw new Error('Cancelled')

        const experience = await input.select({
          message: 'What is your experience level with React?',
          options: [
            { label: 'Beginner', value: 'beginner' },
            { label: 'Intermediate', value: 'intermediate' },
            { label: 'Advanced', value: 'advanced' },
            { label: 'Expert', value: 'expert' },
          ],
          defaultValue: 'intermediate',
        })
        if (!experience) throw new Error('Cancelled')

        const newsletter = await input.confirm({
          message: 'Would you like to subscribe to our newsletter?',
          defaultValue: false,
        })
        if (newsletter === null) throw new Error('Cancelled')

        setProfile({
          name,
          age,
          email,
          experience,
          newsletter,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    runPrompts()
  }, [])

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">❌ Error: {error}</Text>
        <Text dimColor>Press Ctrl+C to exit</Text>
      </Box>
    )
  }

  if (profile) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="green">
          ✅ Profile Created Successfully!
        </Text>
        <Box marginTop={1} flexDirection="column">
          <Text>
            <Text bold>Name:</Text> {profile.name}
          </Text>
          <Text>
            <Text bold>Age:</Text> {profile.age}
          </Text>
          <Text>
            <Text bold>Email:</Text> {profile.email}
          </Text>
          <Text>
            <Text bold>Experience:</Text> {profile.experience}
          </Text>
          <Text>
            <Text bold>Newsletter:</Text> {profile.newsletter ? 'Subscribed' : 'Not subscribed'}
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Thank you for completing the profile!</Text>
        </Box>
      </Box>
    )
  }

  if (isLoading) {
    return (
      <Box padding={1}>
        <Text color="cyan">Loading prompts...</Text>
      </Box>
    )
  }

  return null
}

const Main: React.FC = () => {
  return (
    <InputProvider>
      <App />
    </InputProvider>
  )
}

render(<Main />)
