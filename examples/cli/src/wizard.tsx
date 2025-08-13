#!/usr/bin/env node
import { Box, Newline, render, Text } from 'ink'
import type React from 'react'
import { useEffect, useState } from 'react'
import { InputProvider, initInput, inkRenderers, input } from 'react-imperative-prompt/ink'

// Initialize input system
initInput({
  renderers: inkRenderers,
  defaultRenderer: 'text',
})

interface ProjectConfig {
  name: string
  description: string
  type: 'library' | 'application' | 'cli'
  features: string[]
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun'
  typescript: boolean
  git: boolean
  license: string
}

const ProjectWizard: React.FC = () => {
  const [config, setConfig] = useState<ProjectConfig | null>(null)
  const [isRunning, setIsRunning] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState('')

  useEffect(() => {
    const runWizard = async () => {
      try {
        setCurrentStep('Project Name')
        const name = await input.text({
          message: '📦 What is your project name?',
          validate: (value) => {
            if (!value.trim()) return 'Project name is required'
            if (!/^[a-z0-9-_]+$/i.test(value)) {
              return 'Project name can only contain letters, numbers, hyphens, and underscores'
            }
            return true
          },
        })

        setCurrentStep('Description')
        const description = await input.text({
          message: '📝 Project description:',
          defaultValue: 'A new awesome project',
        })

        setCurrentStep('Project Type')
        const type = (await input.select({
          message: '🎯 What type of project is this?',
          options: [
            { label: '📚 Library - Reusable package', value: 'library' },
            { label: '🌐 Application - Web/Desktop app', value: 'application' },
            { label: '⌨️  CLI - Command line tool', value: 'cli' },
          ],
        })) as 'library' | 'application' | 'cli'

        setCurrentStep('Features')
        const features: string[] = []

        const wantTesting = await input.confirm({
          message: '🧪 Include testing setup?',
          defaultValue: true,
        })
        if (wantTesting) features.push('testing')

        const wantLinting = await input.confirm({
          message: '✨ Include linting and formatting?',
          defaultValue: true,
        })
        if (wantLinting) features.push('linting')

        const wantCI = await input.confirm({
          message: '🚀 Include CI/CD configuration?',
          defaultValue: false,
        })
        if (wantCI) features.push('ci')

        if (type === 'application') {
          const wantDocker = await input.confirm({
            message: '🐳 Include Docker configuration?',
            defaultValue: false,
          })
          if (wantDocker) features.push('docker')
        }

        setCurrentStep('Package Manager')
        const packageManager = (await input.select({
          message: '📦 Choose your package manager:',
          options: [
            { label: 'npm', value: 'npm' },
            { label: 'yarn', value: 'yarn' },
            { label: 'pnpm', value: 'pnpm' },
            { label: 'bun', value: 'bun' },
          ],
          defaultValue: 'npm',
        })) as 'npm' | 'yarn' | 'pnpm' | 'bun'

        setCurrentStep('TypeScript')
        const typescript = await input.confirm({
          message: '💪 Use TypeScript?',
          defaultValue: true,
        })

        setCurrentStep('Git')
        const git = await input.confirm({
          message: '🔧 Initialize git repository?',
          defaultValue: true,
        })

        setCurrentStep('License')
        const license = await input.select({
          message: '⚖️  Choose a license:',
          options: [
            { label: 'MIT', value: 'MIT' },
            { label: 'Apache 2.0', value: 'Apache-2.0' },
            { label: 'GPL 3.0', value: 'GPL-3.0' },
            { label: 'BSD 3-Clause', value: 'BSD-3-Clause' },
            { label: 'None', value: 'UNLICENSED' },
          ],
          defaultValue: 'MIT',
        })

        setCurrentStep('Confirmation')
        const confirmed = await input.confirm({
          message: '✅ Create project with these settings?',
          defaultValue: true,
        })

        if (
          confirmed &&
          name &&
          description &&
          type &&
          packageManager !== null &&
          typescript !== null &&
          git !== null &&
          license
        ) {
          setConfig({
            name,
            description,
            type,
            features,
            packageManager,
            typescript,
            git,
            license,
          })
        } else {
          setError('Project creation cancelled')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Wizard cancelled')
      } finally {
        setIsRunning(false)
        setCurrentStep('')
      }
    }

    runWizard()
  }, [])

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">❌ {error}</Text>
      </Box>
    )
  }

  if (config) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="green">
          🎉 Project Configuration Complete!
        </Text>
        <Newline />

        <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1}>
          <Text bold color="cyan">
            Project: {config.name}
          </Text>
          <Text dimColor>{config.description}</Text>
          <Newline />

          <Text>
            📁 Type: <Text color="yellow">{config.type}</Text>
          </Text>
          <Text>
            📦 Package Manager: <Text color="yellow">{config.packageManager}</Text>
          </Text>
          <Text>
            💻 TypeScript:{' '}
            <Text color={config.typescript ? 'green' : 'gray'}>
              {config.typescript ? 'Yes' : 'No'}
            </Text>
          </Text>
          <Text>
            🔧 Git: <Text color={config.git ? 'green' : 'gray'}>{config.git ? 'Yes' : 'No'}</Text>
          </Text>
          <Text>
            ⚖️ License: <Text color="yellow">{config.license}</Text>
          </Text>

          {config.features.length > 0 && (
            <>
              <Newline />
              <Text bold>Features:</Text>
              {config.features.map((feature) => (
                <Text key={feature}> ✓ {feature}</Text>
              ))}
            </>
          )}
        </Box>

        <Newline />
        <Box flexDirection="column" borderStyle="single" borderColor="gray" padding={1}>
          <Text bold>Next steps:</Text>
          <Text color="gray">1. cd {config.name}</Text>
          <Text color="gray">2. {config.packageManager} install</Text>
          <Text color="gray">
            3. {config.packageManager} {config.packageManager === 'npm' ? 'run ' : ''}dev
          </Text>
        </Box>
      </Box>
    )
  }

  if (isRunning) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="magenta">
          🧙 Project Setup Wizard
        </Text>
        {currentStep && (
          <Box marginTop={1}>
            <Text color="cyan">Current step: {currentStep}</Text>
          </Box>
        )}
      </Box>
    )
  }

  return null
}

const Main: React.FC = () => {
  return (
    <InputProvider>
      <ProjectWizard />
    </InputProvider>
  )
}

render(<Main />)
