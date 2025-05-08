import { BoardStatus, ConnectionStatus } from '../models/MicroFile';

/**
 * Interface for board control operations
 */
export interface IBoard {
  /**
   * Initialize connection with the board
   * @returns Promise with board identification
   */
  initialize(): Promise<string>;

  /**
   * Get current connection status
   * @returns Current connection status
   */
  getConnectionStatus(): ConnectionStatus;

  /**
   * Get current board status
   * @returns Current board execution status
   */
  getBoardStatus(): BoardStatus;

  /**
   * Execute a Python script
   * @param script Optional script content to execute (defaults to main.py)
   * @returns Promise with execution result
   */
  run(script?: string): Promise<string>;

  /**
   * Pause current script execution
   * @returns Promise with success message
   */
  pause(): Promise<string>;

  /**
   * Reset the board
   * @returns Promise with success message
   */
  reset(): Promise<string>;

  /**
   * Get last execution output
   * @returns Last execution output or error message
   */
  getLastOutput(): string;

  /**
   * Subscribe to board status changes
   * @param callback Function to call when status changes
   * @returns Unsubscribe function
   */
  onStatusChange(callback: (status: BoardStatus) => void): () => void;

  /**
   * Subscribe to connection status changes
   * @param callback Function to call when connection status changes
   * @returns Unsubscribe function
   */
  onConnectionChange(callback: (status: ConnectionStatus) => void): () => void;
} 