export interface PaginationResult<T> {
  list: T[];
  pagination: {
    // 공통 필드
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;

    // 페이지 기반 (Optional)
    totalCount?: number;
    totalPage?: number;
    currentPage?: number;

    // 커서 기반 (Optional)
    nextCursor?: string;
  };
}

/**
 * Prisma 쿼리용 skip/take 계산
 */
export const getPagingParams = (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const take = limit;
  return { skip, take };
};

/**
 * 응답 데이터 포맷팅 (페이지 기반)
 */
export const getPagingData = <T>(
  data: T[],
  totalCount: number,
  page: number,
  limit: number,
): PaginationResult<T> => {
  const totalPage = Math.ceil(totalCount / limit);

  return {
    list: data,
    pagination: {
      totalCount,
      totalPage,
      currentPage: page,
      limit: limit,
      hasNextPage: page * limit < totalCount,
      hasPrevPage: page > 1,
    },
  };
};
