/// <reference types="vite/client" />
interface ElaklyPost {
  likes: number;
  type?: string;
  ad?: boolean;
  suggested?: boolean;
}

declare var ElaklyFilter: {
  defaults: Record<string, unknown> & { lang: string };
  reason(post: ElaklyPost, settings: Record<string, unknown>): { id: string } | null;
};
