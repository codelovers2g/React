import React, { useState, useEffect, useCallback } from "react";
import styled from "@emotion/styled";
import { getSession } from "next-auth/client";

import Layout from "components/layouts/AdminModule";
import Pagination from "@material-ui/lab/Pagination";
import { CONSTANTS } from "helpers";
import { Grid } from "@material-ui/core";
import TableItems from "@/components/views/audit/TableItems";
import AppInputSearch from "@/components/shared/AppInputSearch";
import { useLazyGetAuditLogsQuery } from "@/services/AuditLogApi";
const { ROUTES } = CONSTANTS;

const Title = styled.h1`
  margin: 0;
`;

const PaginatorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  opacity: 0.7;
  border-radius: 0px 0px 4px 4px;
`;

const Audit = () => {
  const MAX_RESULT_TABLE = 10;

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(3);

  const [tableQueryParams, setTableQueryParams] = useState({
    Sorting: "ChangeDate DESC",
    SkipCount: 0,
    MaxResultCount: MAX_RESULT_TABLE,
    Filter: "",
  });

  const [getAuditLogs, auditLogs] = useLazyGetAuditLogsQuery();

  useEffect(() => {
    setPages(Math.ceil(auditLogs?.data?.totalCount / MAX_RESULT_TABLE));
  }, [auditLogs?.data]);

  useEffect(() => {
    getAuditLogs(tableQueryParams);
  }, [tableQueryParams]);

  const handleChangePage = (event, value) => {
    setPage(value);
    setTableQueryParams({
      ...tableQueryParams,
      SkipCount: (value - 1) * 10,
    });
  };

  const onClickSorting = value => {
    setTableQueryParams({
      ...tableQueryParams,
      Sorting: value,
    });
  };

  const onInputSearchChange = e => {
    e.preventDefault();
    setTableQueryParams({
      ...tableQueryParams,
      Filter: e.target.value,
      SkipCount: 0,
    });
    setPage(1);
  };

  const debounce = func => {
    let timer;
    return function (...args) {
      const context = this;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        func.apply(context, args);
      }, 1000);
    };
  };
  const optimisedVersion = useCallback(debounce(onInputSearchChange));

  return (
    <>
      <Layout>
        <Grid container spacing={3}>
          <Grid item container alignItems="center" sm={8}>
            <Title>Audit Logs</Title>
          </Grid>
          <Grid item sm={4}>
            <AppInputSearch placeholder="Search" onChange={optimisedVersion} value={null} />
          </Grid>
          <Grid item xs={12}>
            <TableItems items={auditLogs?.data} sortable onClickSorting={onClickSorting} />
          </Grid>
          <Grid item sm={12}>
            <PaginatorContainer>
              {pages > 1 && (
                <Pagination
                  count={pages}
                  variant="outlined"
                  color="primary"
                  shape="rounded"
                  page={page}
                  onChange={handleChangePage}
                />
              )}
            </PaginatorContainer>
          </Grid>
        </Grid>
      </Layout>
    </>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession({ req: context.req });
  if (!session) {
    return {
      redirect: {
        destination: ROUTES.LOGIN,
        permanent: false,
      },
    };
  }

  return {
    props: {
      session,
    },
  };
}

export default Audit;
