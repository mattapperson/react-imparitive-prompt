"use client";

import { useState } from "react";
import { input } from "react-imperative-prompt";

export default function Home() {
  const [results, setResults] = useState<{
    name?: string;
    age?: number;
    email?: string;
    bio?: string;
    rating?: number;
    subscribe?: boolean;
  }>({});

  const handleTextInput = async () => {
    const name = await input.text({
      message: "What is your name?",
      defaultValue: "John Doe",
    });
    setResults((prev) => ({ ...prev, name: name ?? undefined }));
  };

  const handleNumberInput = async () => {
    const age = await input.number({
      message: "How old are you?",
      min: 1,
      max: 120,
      defaultValue: 25,
    });
    setResults((prev) => ({ ...prev, age: age ?? undefined }));
  };

  const handleEmailInput = async () => {
    const email = await input.text({
      message: "Enter your email address",
      placeholder: "user@example.com",
      validate: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return "Please enter a valid email address";
        }
        return true;
      },
    });
    setResults((prev) => ({ ...prev, email: email ?? undefined }));
  };

  const handleMultilineInput = async () => {
    const bio = await input.text({
      message: "Tell us about yourself",
      multiline: true,
      placeholder: "Write your bio here...",
    });
    setResults((prev) => ({ ...prev, bio: bio ?? undefined }));
  };

  const handleSelectInput = async () => {
    const rating = await input.select({
      message: "How would you rate this experience?",
      options: [
        { label: "⭐ Poor", value: 1 },
        { label: "⭐⭐ Fair", value: 2 },
        { label: "⭐⭐⭐ Good", value: 3 },
        { label: "⭐⭐⭐⭐ Great", value: 4 },
        { label: "⭐⭐⭐⭐⭐ Excellent", value: 5 },
      ],
      defaultValue: 3,
    });
    setResults((prev) => ({ ...prev, rating: rating ?? undefined }));
  };

  const handleConfirmInput = async () => {
    const subscribe = await input.confirm({
      message: "Would you like to subscribe to our newsletter?",
      defaultValue: false,
    });
    setResults((prev) => ({ ...prev, subscribe: subscribe ?? undefined }));
  };

  const handleSequentialInputs = async () => {
    try {
      const name = await input.text({
        message: "What is your name?",
      });

      const age = await input.number({
        message: `Hello ${name}, how old are you?`,
        min: 1,
        max: 120,
      });

      const subscribe = await input.confirm({
        message: `Thanks ${name}! Would you like to receive updates?`,
      });

      setResults({
        name: name ?? undefined,
        age: age ?? undefined,
        subscribe: subscribe ?? undefined,
      });
    } catch (error) {
      console.log("User cancelled input");
    }
  };

  const clearResults = () => {
    setResults({});
  };

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">React Imperative Prompt</h1>
        <p className="subtitle">Next.js 15 Example</p>
      </header>

      <section className="demo-section">
        <h2 className="demo-title">Basic Inputs</h2>
        <p className="demo-description">
          Click the buttons below to trigger different types of input prompts.
        </p>
        <div className="button-group">
          <button type="button" className="button" onClick={handleTextInput}>
            Text Input
          </button>
          <button type="button" className="button" onClick={handleNumberInput}>
            Number Input
          </button>
          <button type="button" className="button" onClick={handleEmailInput}>
            Email Input (with validation)
          </button>
          <button
            type="button"
            className="button"
            onClick={handleMultilineInput}
          >
            Multiline Text
          </button>
          <button type="button" className="button" onClick={handleSelectInput}>
            Select Options
          </button>
          <button type="button" className="button" onClick={handleConfirmInput}>
            Confirm Dialog
          </button>
        </div>
      </section>

      <section className="demo-section">
        <h2 className="demo-title">Sequential Flow</h2>
        <p className="demo-description">
          Experience a multi-step input flow where each prompt builds on the
          previous one.
        </p>
        <div className="button-group">
          <button
            type="button"
            className="button"
            onClick={handleSequentialInputs}
          >
            Start Sequential Flow
          </button>
        </div>
      </section>

      {Object.keys(results).length > 0 && (
        <section className="demo-section">
          <h2 className="demo-title">Results</h2>
          <div className="result-box">
            {results.name && (
              <div>
                <div className="result-label">Name:</div>
                <div className="result-value">{results.name}</div>
              </div>
            )}
            {results.age !== undefined && (
              <div>
                <div className="result-label">Age:</div>
                <div className="result-value">{results.age}</div>
              </div>
            )}
            {results.email && (
              <div>
                <div className="result-label">Email:</div>
                <div className="result-value">{results.email}</div>
              </div>
            )}
            {results.bio && (
              <div>
                <div className="result-label">Bio:</div>
                <div className="result-value">{results.bio}</div>
              </div>
            )}
            {results.rating !== undefined && (
              <div>
                <div className="result-label">Rating:</div>
                <div className="result-value">
                  {"⭐".repeat(results.rating)}
                </div>
              </div>
            )}
            {results.subscribe !== undefined && (
              <div>
                <div className="result-label">Newsletter:</div>
                <div className="result-value">
                  {results.subscribe ? "Subscribed" : "Not subscribed"}
                </div>
              </div>
            )}
          </div>
          <div className="button-group" style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="button secondary"
              onClick={clearResults}
            >
              Clear Results
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
