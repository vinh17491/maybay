import { prisma } from "@/lib/prisma";

export const SearchHistoryService = {
  async save(userId: string, query: Record<string, unknown>) {
    return await prisma.searchHistory.create({
      data: {
        userId,
        query: JSON.parse(JSON.stringify(query)),
      },
    });
  },

  async getRecent(userId: string, limit: number = 5) {
    return await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },
};
