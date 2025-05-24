// src/utils/query.js

export const parseQueryParams = (search) => {
    return Object.fromEntries(new URLSearchParams(search));
  };
  