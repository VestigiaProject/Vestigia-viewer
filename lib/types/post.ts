export interface Post {
  id: string;
  figureId: string;
  originalDate: string;
  content: string;
  mediaUrl?: string;
  isSignificant: boolean;
  figure?: {
    name: string;
    title: string;
    profileImage: string;
  };
  interactions?: {
    likes: number;
    comments: number;
    hasLiked?: boolean;
  };
}

export interface PostsResponse {
  posts: Post[];
  nextCursor?: string;
}