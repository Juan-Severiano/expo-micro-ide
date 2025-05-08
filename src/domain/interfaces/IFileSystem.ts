import { MicroFile } from '../models/MicroFile';

/**
 * Interface for file system operations
 */
export interface IFileSystem {
  /**
   * List files in a directory
   * @param path Directory path to list
   * @returns Promise with array of MicroFile objects
   */
  list(path?: string): Promise<MicroFile[]>;

  /**
   * Create a new file
   * @param name Name of the file to create
   * @param path Path where to create the file
   * @returns Promise with success message
   */
  create(name: string, path?: string): Promise<string>;

  /**
   * Remove a file
   * @param fileName Name of the file to remove
   * @param path Path where the file is located
   * @returns Promise with success message
   */
  remove(fileName: string, path?: string): Promise<string>;

  /**
   * Rename a file
   * @param oldName Current name of the file
   * @param newName New name for the file
   * @param path Path where the file is located
   * @returns Promise with success message
   */
  rename(oldName: string, newName: string, path?: string): Promise<string>;

  /**
   * Read file contents
   * @param path Full path to the file
   * @returns Promise with file contents as string
   */
  read(path: string): Promise<string>;

  /**
   * Write content to a file
   * @param path Full path to the file
   * @param content Content to write
   * @returns Promise with success message
   */
  write(path: string, content: string): Promise<string>;
} 