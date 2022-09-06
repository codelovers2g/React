import React, { useState, useEffect, useCallback } from "react";
import { useSelector, shallowEqual } from "react-redux";
import styled from "@emotion/styled";
import { getSession } from "next-auth/client";
import { useDispatch } from "react-redux";
import { setNotification } from "store/slices/rootSlice";
import Layout from "components/layouts/AdminModule";
import TableItems from "components/views/admin-module/components/Regions/TableItems";
import Pagination from "@material-ui/lab/Pagination";
import { Grid } from "@material-ui/core";
import { COLORS, CONSTANTS } from "helpers";
import { AppButton, AppInput, AppSelect } from "components/shared";
import AddCollapsible from "@/components/views/admin-module/components/AddCollapsible";
import AppInputSearch from "@/components/shared/AppInputSearch";

import { useCreateAppRegionMutation, useLazyGetRegionQuery } from "../../../store/services/RegionApi";
import { useGetHealthCenterQuery } from "@/services/HealthCenterApi";

import { sortDropdownOptions } from "@/helpers/ui";
import EditRegion from "@/components/views/admin-module/components/Regions/EditRegion";
import { FiAlertCircle } from "react-icons/fi";
const { ROUTES } = CONSTANTS;
import { isInternalExternalSupport } from "@/helpers/authorizeRoles";

const ActionButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  & > * {
    margin-left: 5px;
  }
`;

const Title = styled.h1`
  margin: 0;
`;

const SubTitle = styled.h2`
  margin: 0;
`;

const PaginatorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  opacity: 0.7;
  border-radius: 0px 0px 4px 4px;
`;

const MessageContainer = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  color: ${COLORS.colorNeutral80};
`;

const AlertIcon = styled(FiAlertCircle)`
  margin-right: 5px;
  font-size: 14px;
`;

const Region = () => {
  const dispatch = useDispatch();
  const params = {
    skipCount: 0,
    maxResultCount: 1000,
  };

  const initialStateDropdowns = {
    healthCenter: [],
  };

  const initialStateModel = {
    healthCenterId: null,
  };

  const MAX_RESULT_TABLE = 10;
  const MAX_REGION_NAME_LENGTH = 30;

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [healthCenterList, setHealthCenterList] = useState([]);
  const [dropdowns, setDropdowns] = useState(initialStateDropdowns);
  const [regionToEdit, setRegionToEdit] = useState(null);
  const [editRegionOpen, setEditRegionOpen] = useState(false);
  const [model, setModel] = useState(initialStateModel);
  const [charRegionNameCount, setCharRegionNameCount] = useState(0);
  const personalInformation = useSelector(state => state.setting.personalInformation.data, shallowEqual);

  const [tableQueryParams, setTableQueryParams] = useState({
    Sorting: "Name ASC",
    SkipCount: 0,
    MaxResultCount: MAX_RESULT_TABLE,
    Filter: "",
  });

  const { data: healthCenters = {} } = useGetHealthCenterQuery(params);

  const [getRegions, regions] = useLazyGetRegionQuery();

  const [createRegion, { isSuccess: successCreating, isError: isErrorCreating, error: errorCreating }] =
    useCreateAppRegionMutation();

  useEffect(() => {
    setPages(Math.ceil(regions?.data?.totalCount / MAX_RESULT_TABLE));
  }, [regions?.data]);

  useEffect(() => {
    getRegions(tableQueryParams);
  }, [tableQueryParams]);

  useEffect(() => {
    if (healthCenters.items) {
      const healthCenterMapped = healthCenters.items.map(healthCenter => ({
        id: healthCenter.id,
        text: healthCenter.name,
      }));
      setHealthCenterList(healthCenterMapped);
    }
  }, [healthCenters.items]);

  useEffect(() => {
    if (successCreating) {
      dispatch(
        setNotification({
          type: "success",
          message: "Your changes were saved",
        })
      );
      onClearAll();
      getRegions(tableQueryParams);
    }
  }, [successCreating]);

  useEffect(() => {
    if (isErrorCreating) {
      dispatch(
        setNotification({
          type: "danger",
          message: errorCreating?.data?.error?.message,
          details: errorCreating?.data?.error?.details,
        })
      );
    }
  }, [isErrorCreating]);

  const handleChangePage = (event, value) => {
    setPage(value);
    setTableQueryParams({
      ...tableQueryParams,
      SkipCount: (value - 1) * 10,
    });
  };

  const onClickSorting = value => {
    setTableQueryParams({
      ...model,
      Sorting: value,
    });
  };

  const onOpenEditModal = async region => {
    setRegionToEdit(region);
    setEditRegionOpen(true);
  };

  const onCloseEditModal = () => {
    setRegionToEdit(null);
    setEditRegionOpen(false);
  };

  const onClickAddRegion = () => {
    createRegion(model);
  };

  const onRegionNameChangeHandler = event => {
    setCharRegionNameCount(event.target.value.length);
    setModel({
      ...model,
      name: event.target.value,
    });
  };

  const onRegionChangeHandler = healthCenterIds => {
    setDropdowns({ ...dropdowns, healthCenter: healthCenterIds });
    setModel({
      ...model,
      healthCenterId: healthCenterIds[0]?.id,
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

  const validateCreate = () => {
    return !model?.healthCenterId || !model?.name;
  };

  const validateClearAll = () => {
    return model?.regionId || model?.name;
  };

  const onClearAll = () => {
    setModel({ ...initialStateModel, name: "" });
    setDropdowns(initialStateDropdowns);
    setCharRegionNameCount(0);
  };

  return (
    <>
      <Layout>
        <Grid container spacing={3}>
          <Grid item sm={12}>
            <Title>Manage Regions</Title>
          </Grid>
          {!isInternalExternalSupport(personalInformation?.userType) && (
            <Grid item sm={12} spacing={3}>
              <AddCollapsible title="Add Region">
                <Grid container spacing={1}>
                  <Grid item sm={6}>
                    <AppInput
                      name="name"
                      label="Name"
                      placeholder="Region name"
                      value={model.name}
                      onChange={onRegionNameChangeHandler}
                      isRequired
                    />
                  </Grid>
                  <Grid item sm={6}>
                    <AppSelect
                      label="Health Center"
                      placeholder="Select Health Center"
                      values={dropdowns.healthCenter}
                      options={sortDropdownOptions([...healthCenterList], "text")}
                      onChange={onRegionChangeHandler}
                      valueField="id"
                      valueLabel="text"
                      isRequired
                      backgroundColor="white"
                    />
                  </Grid>
                  <Grid item sm={12} container justifyContent="flex-end">
                    <MessageContainer>
                      {charRegionNameCount > MAX_REGION_NAME_LENGTH && (
                        <>
                          <AlertIcon /> You have used {charRegionNameCount} characters. Please limit your region names
                          to 30 characters.
                        </>
                      )}
                    </MessageContainer>
                    <ActionButtonsContainer>
                      <AppButton
                        label="Clear all"
                        type="secondary"
                        onClick={onClearAll}
                        disabled={!validateClearAll()}
                      />
                      <AppButton label="Create" type="primary" onClick={onClickAddRegion} disabled={validateCreate()} />
                    </ActionButtonsContainer>
                  </Grid>
                </Grid>
              </AddCollapsible>
            </Grid>
          )}
          <Grid item container alignItems="center" sm={8}>
            <SubTitle>Regions List</SubTitle>
          </Grid>
          <Grid item sm={4}>
            <AppInputSearch placeholder="Search" onChange={optimisedVersion} value={null} />
          </Grid>
          <Grid item xs={12}>
            <TableItems
              items={regions.data}
              sortable
              onOpenEditModal={onOpenEditModal}
              onClickSorting={onClickSorting}
              isFetching={regions.isFetching}
              tableQueryParams={tableQueryParams}
              isEditDisabled={!isInternalExternalSupport(personalInformation?.userType)}
            />
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
        <EditRegion
          open={editRegionOpen}
          onCloseEditModal={onCloseEditModal}
          regionToEdit={regionToEdit}
          healthCenterList={healthCenterList}
          tableQueryParams={tableQueryParams}
          getRegions={getRegions}
        />
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

export default Region;
