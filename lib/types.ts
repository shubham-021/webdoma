export interface Account {
  id: number;
  webdav_username: string;
  webdav_password: string; // encrypted
  rclone_config_name: string;
  last_synced_at: string | null;
  created_at: string;
}

export interface UserAccount {
  user_id: number;
  account_id: number;
  is_active: number;
  created_at: string;
}

// Session data stored in encrypted iron-session cookie
export interface SessionData {
  userId?: number;           // Application user ID (replaces username/password)
  playerProtocol: string;    // default: "vlc"
}

// TorBox account response for client-side display
export interface TorBoxAccount {
  id: number;
  webdav_username: string;
  is_active: boolean;
  last_synced_at: string | null;
}

// File item returned by GET /api/files (from DB join)
export interface FileItem {
  id: number;
  account_id: number;
  remote_path: string;
  filename: string;
  size: number;
  sizeFormatted: string;
  mime_type: string;
  last_modified: string;
  tmdb_id: number | null;
  raw_title: string | null;
  raw_year: string | null;
  synced_at: string;
  // Joined media fields
  media_title: string | null;
  media_year: string | null;
  media_poster_url: string | null;
  media_type: "movie" | "tv" | null;
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

export interface RegisterRequest {
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

// Account management
export interface AddAccountRequest {
  webdav_username: string;
  webdav_password: string;
}

export interface AddAccountResponse {
  success: boolean;
  account?: TorBoxAccount;
  error?: string;
}

export interface SyncRequest {
  account_id: number;
}

export interface SyncResponse {
  success: boolean;
  files_synced?: number;
  error?: string;
}