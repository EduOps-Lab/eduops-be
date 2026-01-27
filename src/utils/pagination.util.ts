export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  list: T[];
  pagination: {
    totalCount: number;
    totalPages: number;
    page: number;
    pageSize: number;
  };
}

/**
 * Prisma 쿼리용 skip/take 계산
 */
export const getPagingParams = (page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  return { skip, take };
};

/**
 * 응답 데이터 포맷팅
 */
export const getPagingData = <T>(
  data: T[],
  totalCount: number,
  page: number,
  pageSize: number,
): PaginationResult<T> => {
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    list: data,
    pagination: {
      totalCount,
      totalPages,
      page,
      pageSize,
    },
  };
};
