import { describe, it, expect, beforeEach, mock } from 'bun:test';

const jest = {
  fn: mock,
};
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { TextInputModal, NumberInputModal, webRenderers } from '../webRenderers';
import type { InputPrompt } from '../types';

describe('TextInputModal', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultPrompt: InputPrompt<string> = {
    id: 'test-id',
    message: 'Enter text',
    resolve: jest.fn(),
  };

  beforeEach(() => {
    cleanup();
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  it('should render with message', () => {
    render(
      <TextInputModal
        prompt={defaultPrompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Enter text')).toBeTruthy();
  });

  it('should show queue length when > 0', () => {
    render(
      <TextInputModal
        prompt={defaultPrompt}
        queueLength={3}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('3 more steps remaining')).toBeTruthy();
  });

  it('should show singular for queue length of 1', () => {
    render(
      <TextInputModal
        prompt={defaultPrompt}
        queueLength={1}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('1 more step remaining')).toBeTruthy();
  });

  it('should not show queue indicator when 0', () => {
    render(
      <TextInputModal
        prompt={defaultPrompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByText(/more step/)).toBeNull();
  });

  it('should use default value', () => {
    const prompt = { ...defaultPrompt, defaultValue: 'default text' };
    render(
      <TextInputModal
        prompt={prompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('default text');
  });

  it('should use placeholder', () => {
    const prompt = { ...defaultPrompt, placeholder: 'Enter something...' };
    render(
      <TextInputModal
        prompt={prompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.placeholder).toBe('Enter something...');
  });

  it('should handle text input change', () => {
    render(
      <TextInputModal
        prompt={defaultPrompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'new text' } });
    expect(input.value).toBe('new text');
  });

  it('should submit on form submit', () => {
    render(
      <TextInputModal
        prompt={defaultPrompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'submitted text' } });
    
    const form = input.closest('form')!;
    fireEvent.submit(form);

    expect(mockOnSubmit).toHaveBeenCalledWith('submitted text');
  });

  it('should not submit empty required field', () => {
    const prompt = { ...defaultPrompt, required: true };
    render(
      <TextInputModal
        prompt={prompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '   ' } }); // whitespace only
    
    const form = input.closest('form')!;
    fireEvent.submit(form);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should allow empty non-required field', () => {
    const prompt = { ...defaultPrompt, required: false };
    render(
      <TextInputModal
        prompt={prompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const form = screen.getByRole('textbox').closest('form')!;
    fireEvent.submit(form);

    expect(mockOnSubmit).toHaveBeenCalledWith('');
  });

  it('should handle cancel button', () => {
    render(
      <TextInputModal
        prompt={defaultPrompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should show Next button when queue > 0', () => {
    render(
      <TextInputModal
        prompt={defaultPrompt}
        queueLength={2}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Next')).toBeTruthy();
    expect(screen.queryByText('Submit')).toBeNull();
  });

  it('should show Submit button when queue is 0', () => {
    render(
      <TextInputModal
        prompt={defaultPrompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Submit')).toBeTruthy();
    expect(screen.queryByText('Next')).toBeNull();
  });

  it('should render password input for password kind', () => {
    const prompt = { ...defaultPrompt, kind: 'password' };
    render(
      <TextInputModal
        prompt={prompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = document.getElementById('text-input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.type).toBe('password');
  });

  it('should render email input for email kind', () => {
    const prompt = { ...defaultPrompt, kind: 'email' };
    render(
      <TextInputModal
        prompt={prompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = document.getElementById('text-input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.type).toBe('email');
  });

  it('should render text input for unknown kind', () => {
    const prompt = { ...defaultPrompt, kind: 'unknown' };
    render(
      <TextInputModal
        prompt={prompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = document.getElementById('text-input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.type).toBe('text');
  });

  it('should have proper aria attributes', () => {
    render(
      <TextInputModal
        prompt={defaultPrompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });
});

describe('NumberInputModal', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultPrompt: InputPrompt<number> = {
    id: 'test-id',
    message: 'Enter number',
    resolve: jest.fn(),
  };

  beforeEach(() => {
    cleanup();
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  it('should render with message', () => {
    render(
      <NumberInputModal
        prompt={defaultPrompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Enter number')).toBeTruthy();
  });

  it('should use default value', () => {
    const prompt = { ...defaultPrompt, defaultValue: 42 };
    render(
      <NumberInputModal
        prompt={prompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = document.getElementById('number-input') as HTMLInputElement;
    expect(input.value).toBe('42');
  });

  it('should handle number input', () => {
    render(
      <NumberInputModal
        prompt={defaultPrompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = document.getElementById('number-input');
    fireEvent.change(input, { target: { value: '123' } });
    
    const form = input.closest('form')!;
    fireEvent.submit(form);

    expect(mockOnSubmit).toHaveBeenCalledWith(123);
  });

  it('should handle decimal numbers', () => {
    render(
      <NumberInputModal
        prompt={defaultPrompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = document.getElementById('number-input');
    fireEvent.change(input, { target: { value: '3.14' } });
    
    const form = input.closest('form')!;
    fireEvent.submit(form);

    expect(mockOnSubmit).toHaveBeenCalledWith(3.14);
  });

  it('should handle negative numbers', () => {
    render(
      <NumberInputModal
        prompt={defaultPrompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = document.getElementById('number-input');
    fireEvent.change(input, { target: { value: '-42' } });
    
    const form = input.closest('form')!;
    fireEvent.submit(form);

    expect(mockOnSubmit).toHaveBeenCalledWith(-42);
  });

  it('should cancel on empty non-required field', () => {
    const prompt = { ...defaultPrompt, required: false };
    render(
      <NumberInputModal
        prompt={prompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const form = screen.getByLabelText('Enter number').closest('form')!;
    fireEvent.submit(form);

    expect(mockOnCancel).toHaveBeenCalled();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should not submit empty required field', () => {
    const prompt = { ...defaultPrompt, required: true };
    render(
      <NumberInputModal
        prompt={prompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const form = screen.getByLabelText('Enter number').closest('form')!;
    fireEvent.submit(form);

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('should handle invalid number for required field', () => {
    const prompt = { ...defaultPrompt, required: true };
    render(
      <NumberInputModal
        prompt={prompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = document.getElementById('number-input');
    fireEvent.change(input, { target: { value: 'not a number' } });
    
    const form = input.closest('form')!;
    fireEvent.submit(form);

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('should cancel on invalid number for non-required field', () => {
    const prompt = { ...defaultPrompt, required: false };
    render(
      <NumberInputModal
        prompt={prompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = document.getElementById('number-input');
    fireEvent.change(input, { target: { value: 'not a number' } });
    
    const form = input.closest('form')!;
    fireEvent.submit(form);

    expect(mockOnCancel).toHaveBeenCalled();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should not submit invalid number for required field', () => {
    const prompt = { ...defaultPrompt, required: true };
    render(
      <NumberInputModal
        prompt={prompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = document.getElementById('number-input');
    fireEvent.change(input, { target: { value: 'invalid' } });
    
    const form = input.closest('form')!;
    fireEvent.submit(form);

    // Should not call either handler for invalid required input
    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('should have number input type', () => {
    render(
      <NumberInputModal
        prompt={defaultPrompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = document.getElementById('number-input') as HTMLInputElement;
    expect(input.type).toBe('number');
    expect(input.inputMode).toBe('decimal');
  });

  it('should show queue information', () => {
    render(
      <NumberInputModal
        prompt={defaultPrompt}
        queueLength={2}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('2 more steps remaining')).toBeTruthy();
    expect(screen.getByText('Next')).toBeTruthy();
  });

  it('should handle cancel button', () => {
    render(
      <NumberInputModal
        prompt={defaultPrompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should use placeholder', () => {
    const prompt = { ...defaultPrompt, placeholder: '0-100' };
    render(
      <NumberInputModal
        prompt={prompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = document.getElementById('number-input') as HTMLInputElement;
    expect(input.placeholder).toBe('0-100');
  });

  it('should handle zero as valid input', () => {
    render(
      <NumberInputModal
        prompt={defaultPrompt}
        queueLength={0}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = document.getElementById('number-input');
    fireEvent.change(input, { target: { value: '0' } });
    
    const form = input.closest('form')!;
    fireEvent.submit(form);

    expect(mockOnSubmit).toHaveBeenCalledWith(0);
  });
});

describe('webRenderers', () => {
  it('should export all renderer types', () => {
    expect(webRenderers.text).toBe(TextInputModal);
    expect(webRenderers.email).toBe(TextInputModal);
    expect(webRenderers.password).toBe(TextInputModal);
    expect(webRenderers.number).toBe(NumberInputModal);
    expect(webRenderers.default).toBe(TextInputModal);
  });

  it('should have correct keys', () => {
    const keys = Object.keys(webRenderers);
    expect(keys).toContain('text');
    expect(keys).toContain('email');
    expect(keys).toContain('password');
    expect(keys).toContain('number');
    expect(keys).toContain('default');
  });
});