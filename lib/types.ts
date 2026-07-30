// Session data stored in encrypted iron-session cookie
export interface SessionData {
  username: string;
  password: string;
  playerProtocol: string; // default: "vlc"
}

// File item returned by GET /api/files
export interface FileItem {
  name: string;
  path: string;
  size: number;
  sizeFormatted: string;
  type: "file" | "directory";
  mimeType: string;
  lastModified: string;
  isVideo: boolean;
  isAudio: boolean;
  extension: string;
}

// Breadcrumb segment
export interface BreadcrumbItem {
  name: string;
  path: string;
}

// Player configuration
export interface PlayerConfig {
  id: string;
  name: string;
  urlTemplate: string;
  platforms: string[];
}

// Stream token for native player auth
export interface StreamToken {
  filePath: string;
  username: string;
  password: string;
  expiresAt: number; // Unix timestamp
}

// API response types
export interface FilesResponse {
  items: FileItem[];
  currentPath: string;
  breadcrumbs: BreadcrumbItem[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface CreateTokenRequest {
  filePath: string;
}

export interface CreateTokenResponse {
  token: string;
  expiresAt: string;
}

export interface ApiError {
  error: string;
}
