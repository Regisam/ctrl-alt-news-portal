import { prisma } from '../prisma';

export async function validateDepth(parentId: string, maxDepth: number = 3): Promise<{ valid: boolean; depth: number; error?: string }> {
  let currentId: string | null = parentId;
  let depth = 1;

  while (currentId && depth < maxDepth) {
    const parentComment: { parentId: string | null } | null = await prisma.comment.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });

    if (!parentComment) {
      return { valid: false, depth, error: 'Parent comment not found' };
    }

    if (!parentComment.parentId) {
      return { valid: true, depth };
    }

    currentId = parentComment.parentId;
    depth++;
  }

  if (depth >= maxDepth) {
    return { valid: false, depth, error: `Maximum nesting level (${maxDepth}) reached` };
  }

  return { valid: true, depth };
}
