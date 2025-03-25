import { castArray } from "lodash-es";
import { useEffect } from "react";
import type { ArrayOrSingle } from "ts-essentials";

interface Props {
    query?:
      | {
          status: "pending";
        }
      | {
          status: "error";
          error: any;
        }
      | {
          status: "success";
          data: any;
        };
    hide?: ArrayOrSingle<"pending" | "error">;
    error?: any;
    pending?: any;
    success?: any;
}


function Query({
    query,
    hide = [],
    error,
    pending,
    success,
  }: Props) {
  
    useEffect(() => {
        if (query?.status === "error") {
            console.error(query.error);
          }
    }, [query])

  let hideArray = castArray(hide);

  if (query === undefined) {
    return <p>Query the status of authentication... Requires query property</p>
  }

  if (query?.status === "pending") {
    if (!hideArray.includes("pending")) {
        if (pending) {
            return <p>Pending</p>
        } else {
            return <p>Loading...</p>
        }
    }
  } else if (query?.status === "error") {
    if (!hideArray.includes("error")) {
        if (error) {
            return <p>{query.error}</p>
        } else {
            return <p>Error: nothing</p>
        }
    }
  } else if (query?.status === "success") {
    return <p>{query?.data}</p>
  }
}

export default Query;