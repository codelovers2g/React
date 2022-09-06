import React, { useState, useEffect, useCallback } from "react";
import styled from "@emotion/styled";
import { getSession } from "next-auth/client";
import { useDispatch } from "react-redux";
import { setNotification } from "store/slices/rootSlice";
import { useSelector, shallowEqual } from "react-redux";
import Layout from "components/layouts/AdminModule";
import TableItems from "components/views/admin-module/components/Office/TableItems";
import Pagination from "@material-ui/lab/Pagination";
import { Grid } from "@material-ui/core";
import { COLORS, CONSTANTS } from "helpers";
import { AppButton, AppInput, AppSelect, AppTimePicker } from "components/shared";
import AddCollapsible from "@/components/views/admin-module/components/AddCollapsible";
import AppInputSearch from "@/components/shared/AppInputSearch";
import { isInternalExternalSupport } from "@/helpers/authorizeRoles";
import { useCreateAppOfficeMutation, useLazyGetOfficesQuery } from "../../../store/services/OfficeApi";
import { useGetRegionQuery } from "@/services/RegionApi";
import { useGetRoomsQuery } from "../../../store/services/RoomApi";
import { differenceInMilliseconds, startOfDay } from "date-fns";
import { sortDropdownOptions } from "@/helpers/ui";
import { timeZones, timeZonesCountryCodes } from "@/helpers/timeZones";
import EditOffice from "@/components/views/admin-module/components/Office/EditOffice";

import { FiAlertCircle } from "react-icons/fi";

const { ROUTES } = CONSTANTS;

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

const Office = () => {
  const dispatch = useDispatch();
  const params = {
    skipCount: 0,
    maxResultCount: 1000,
  };

  const timeZonesList = timeZones.find(tz => tz.id === timeZonesCountryCodes.US).timezones;

  const initialStateDropdowns = {
    region: [],
    timeZone: [],
    rooms: [],
  };

  const initialStateModel = {
    regionId: null,
    timeZoneIana: null,
    roomIds: [],
    beginTime: 0,
    endTime: 0,
  };

  const MAX_RESULT_TABLE = 10;
  const MAX_OFFICE_NAME_LENGTH = 30;

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [regionsList, setRegionsList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [dropdowns, setDropdowns] = useState(initialStateDropdowns);
  const [officeToEdit, setOfficeToEdit] = useState(null);
  const [editOfficeOpen, setEditOfficeOpen] = useState(false);
  const [charOfficeNameCount, setCharOfficeNameCount] = useState(0);
  const [model, setModel] = useState(initialStateModel);
  const personalInformation = useSelector(state => state.setting.personalInformation.data, shallowEqual);

  const [tableQueryParams, setTableQueryParams] = useState({
    Sorting: "Name ASC",
    SkipCount: 0,
    MaxResultCount: MAX_RESULT_TABLE,
    Filter: "",
  });

  const { data: regions = {} } = useGetRegionQuery(params);
  const { data: rooms = {} } = useGetRoomsQuery(params);

  const [getOffices, offices] = useLazyGetOfficesQuery();

  const [createOffice, { isSuccess: successCreating, isError: isErrorCreating, error: errorCreating }] =
    useCreateAppOfficeMutation();

  useEffect(() => {
    setPages(Math.ceil(offices?.data?.totalCount / MAX_RESULT_TABLE));
  }, [offices?.data]);

  useEffect(() => {
    getOffices(tableQueryParams);
  }, [tableQueryParams]);

  useEffect(() => {
    if (regions.items) {
      const regionsMapped = regions.items.map(region => ({
        id: region.id,
        text: region.name,
      }));
      setRegionsList(regionsMapped);
    }
  }, [regions.items]);

  useEffect(() => {
    if (rooms.items) {
      const roomsMapped = rooms.items.map(room => ({
        id: room.id,
        text: room.name,
      }));
      setRoomsList(roomsMapped);
    }
  }, [rooms.items]);

  useEffect(() => {
    if (successCreating) {
      dispatch(
        setNotification({
          type: "success",
          message: "Your changes were saved",
        })
      );
      getOffices(tableQueryParams);
      onClearAll();
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

  const onOpenEditModal = async office => {
    setOfficeToEdit(office);
    setEditOfficeOpen(true);
  };

  const onCloseEditModal = () => {
    setOfficeToEdit(null);
    setEditOfficeOpen(false);
  };

  const onClickAddOffice = () => {
    const ticksPerMillisecond = 10000;
    const payload = { ...model };
    if (payload.beginTime != 0 && payload.endTime != 0) {
      payload.beginTime = differenceInMilliseconds(model.beginTime, startOfDay(model.beginTime)) * ticksPerMillisecond;
      payload.endTime = differenceInMilliseconds(model.endTime, startOfDay(model.endTime)) * ticksPerMillisecond;
    } else {
      payload.beginTime = 0;
      payload.endTime = 0;
    }
    createOffice(payload);
  };

  const onOfficeNameChangeHandler = event => {
    setCharOfficeNameCount(event.target.value.length);
    setModel({
      ...model,
      name: event.target.value,
    });
  };

  const onRegionChangeHandler = regions => {
    setDropdowns({ ...dropdowns, region: regions });
    setModel({
      ...model,
      regionId: regions[0]?.id,
    });
  };

  const onRoomsChangeHandler = selection => {
    setDropdowns({ ...dropdowns, rooms: selection });
    setModel({
      ...model,
      roomIds: Array.isArray(selection) ? selection.map(x => x.id) : [],
    });
  };

  const onTimeZoneChangeHandler = timeZones => {
    setDropdowns({ ...dropdowns, timeZone: timeZones });
    setModel({
      ...model,
      timeZoneIana: timeZones[0]?.id,
    });
  };

  const onTimeStartChangeHandler = time => {
    setModel({
      ...model,
      beginTime: time,
    });
  };

  const onTimeEndChangeHandler = time => {
    setModel({
      ...model,
      endTime: time,
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
    return !model?.regionId || !model.name || !model.timeZoneIana;
  };

  const validateClearAll = () => {
    return (
      model?.regionId ||
      model.name ||
      model.timeZoneIana ||
      model.roomIds.length > 0 ||
      model.beginTime ||
      model.endTime
    );
  };

  const onClearAll = () => {
    setModel({ ...initialStateModel, name: "", roomIds: [] });
    setDropdowns(initialStateDropdowns);
    setCharOfficeNameCount(0);
  };

  return (
    <>
      <Layout>
        <Grid container spacing={3}>
          <Grid item sm={12}>
            <Title>Manage Offices</Title>
          </Grid>
          {!isInternalExternalSupport(personalInformation?.userType) && (
            <Grid item sm={12} spacing={3}>
              <AddCollapsible title="Add Office">
                <Grid container spacing={1}>
                  <Grid item sm={4}>
                    <AppInput
                      name="name"
                      label="Name"
                      placeholder="Office name"
                      value={model.name}
                      onChange={onOfficeNameChangeHandler}
                      isRequired
                    />
                  </Grid>
                  <Grid item sm={4}>
                    <AppSelect
                      label="Time Zone"
                      placeholder="Select Time Zone"
                      values={dropdowns.timeZone}
                      options={sortDropdownOptions([...timeZonesList], "name")}
                      onChange={onTimeZoneChangeHandler}
                      valueField="id"
                      valueLabel="name"
                      isRequired
                      searchBy="name"
                      backgroundColor="white"
                    />
                  </Grid>
                  <Grid item sm={2}>
                    <AppTimePicker
                      label="Open Time"
                      timeIntervals={30}
                      value={model.beginTime}
                      onKeyDown={e => {
                        e.preventDefault();
                      }}
                      onChange={onTimeStartChangeHandler}
                      disableControls
                      wheelDisabled
                    />
                  </Grid>
                  <Grid item sm={2}>
                    <AppTimePicker
                      label="Close Time"
                      timeIntervals={30}
                      value={model.endTime}
                      onKeyDown={e => {
                        e.preventDefault();
                      }}
                      onChange={onTimeEndChangeHandler}
                      disableControls
                      wheelDisabled
                    />
                  </Grid>
                  <Grid item sm={6}>
                    <AppSelect
                      label="Region"
                      placeholder="Select Region"
                      values={dropdowns.region}
                      options={sortDropdownOptions([...regionsList], "text")}
                      onChange={onRegionChangeHandler}
                      valueField="id"
                      valueLabel="text"
                      isRequired
                      backgroundColor="white"
                    />
                  </Grid>
                  <Grid item sm={6}>
                    <AppSelect
                      label="Rooms"
                      placeholder="Select Rooms"
                      values={dropdowns.rooms}
                      options={sortDropdownOptions([...roomsList], "text")}
                      onChange={onRoomsChangeHandler}
                      valueField="id"
                      valueLabel="text"
                      multi
                      backgroundColor="white"
                    />
                  </Grid>
                  <Grid item sm={12} container justifyContent="space-between" alignItems="center">
                    <MessageContainer>
                      {charOfficeNameCount > MAX_OFFICE_NAME_LENGTH && (
                        <>
                          <AlertIcon /> You have used {charOfficeNameCount} characters. Please limit your office names
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
                      <AppButton label="Create" type="primary" onClick={onClickAddOffice} disabled={validateCreate()} />
                    </ActionButtonsContainer>
                  </Grid>
                </Grid>
              </AddCollapsible>
            </Grid>
          )}
          <Grid item container alignItems="center" sm={8}>
            <SubTitle>Offices List</SubTitle>
          </Grid>
          <Grid item sm={4}>
            <AppInputSearch placeholder="Search" onChange={optimisedVersion} value={null} />
          </Grid>
          <Grid item xs={12}>
            <TableItems
              items={offices.data}
              sortable
              onOpenEditModal={onOpenEditModal}
              onClickSorting={onClickSorting}
              isFetching={offices.isFetching}
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
        <EditOffice
          open={editOfficeOpen}
          onCloseEditModal={onCloseEditModal}
          officeToEdit={officeToEdit}
          regionsList={regionsList}
          timeZonesList={timeZonesList}
          roomsList={roomsList}
          getOffices={getOffices}
          tableQueryParams={tableQueryParams}
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

export default Office;
