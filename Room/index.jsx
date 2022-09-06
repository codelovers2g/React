import React, { useCallback, useState, useEffect } from "react";
import { useSelector, shallowEqual } from "react-redux";
import styled from "@emotion/styled";
import { getSession } from "next-auth/client";
import { useDispatch } from "react-redux";
import { setNotification } from "store/slices/rootSlice";
import { isInternalExternalSupport } from "@/helpers/authorizeRoles";
import Layout from "components/layouts/AdminModule";
import TableItems from "components/views/admin-module/components/Rooms/TableItems";
import Pagination from "@material-ui/lab/Pagination";
import { Grid } from "@material-ui/core";
import { COLORS, CONSTANTS } from "helpers";
import { AppButton, AppInput } from "components/shared";
import AddCollapsible from "@/components/views/admin-module/components/AddCollapsible";
import AppInputSearch from "components/shared/AppInputSearch";
import { useCreateAppRoomMutation, useLazyGetRoomsQuery } from "../../../store/services/RoomApi";
import EditRoom from "@/components/views/admin-module/components/Rooms/EditRoom";
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

const Subtitle = styled.div`
  font-size: 20px;
  line-height: 24px;
  letter-spacing: 0;
  font-weight: 600;
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

const Room = () => {
  const dispatch = useDispatch();

  const initialStateModel = {
    name: "",
  };

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [roomToEdit, setRoomToEdit] = useState(null);
  const [editRoomOpen, setEditRoomOpen] = useState(false);
  const [charRoomNameCount, setCharRoomNameCount] = useState(0);
  const [model, setModel] = useState(initialStateModel);
  const personalInformation = useSelector(state => state.setting.personalInformation.data, shallowEqual);

  const MAX_RESULT_TABLE = 10;
  const MAX_ROOM_NAME_LENGTH = 30;

  const [tableQueryParams, setTableQueryParams] = useState({
    Sorting: "Name ASC",
    SkipCount: 0,
    MaxResultCount: MAX_RESULT_TABLE,
    Filter: "",
  });

  const [getRooms, rooms] = useLazyGetRoomsQuery();

  const [createRoom, { isSuccess: successCreating, isError: isErrorCreating, error: errorCreating }] =
    useCreateAppRoomMutation();

  useEffect(() => {
    setPages(Math.ceil(rooms?.data?.totalCount / MAX_RESULT_TABLE));
  }, [rooms?.data]);

  useEffect(() => {
    getRooms(tableQueryParams);
  }, [tableQueryParams]);

  useEffect(() => {
    if (successCreating) {
      dispatch(
        setNotification({
          type: "success",
          message: "Your changes were saved",
        })
      );
      setPage(1);
      clearModel();
      getRooms(tableQueryParams);
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

  const onOpenEditModal = async room => {
    setRoomToEdit(room);
    setEditRoomOpen(true);
  };

  const onCloseEditModal = () => {
    setRoomToEdit(null);
    setEditRoomOpen(false);
  };

  const onClickAddRoom = () => {
    createRoom(model);
  };

  const onRoomNameChangeHandler = event => {
    setCharRoomNameCount(event.target.value.length);
    setModel({
      ...model,
      name: event.target.value,
    });
  };

  const validateCreate = () => {
    return !model.name;
  };

  const clearModel = () => {
    setModel(initialStateModel);
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
    <Layout>
      <Grid container spacing={3}>
        <Grid item sm={12}>
          <Title>Manage Rooms</Title>
        </Grid>
        {!isInternalExternalSupport(personalInformation?.userType) && (
          <Grid item sm={12} spacing={3}>
            <AddCollapsible title="Add Room">
              <Grid container spacing={1}>
                <Grid item sm={12}>
                  <AppInput
                    name="name"
                    label="Name"
                    placeholder="Room name"
                    value={model.name}
                    onChange={onRoomNameChangeHandler}
                    isRequired
                  />
                </Grid>
                <Grid item sm={12} container justifyContent="flex-end">
                  <MessageContainer>
                    {charRoomNameCount > MAX_ROOM_NAME_LENGTH && (
                      <>
                        <AlertIcon /> You have used {charRoomNameCount} characters. Please limit your room names to 30
                        characters.
                      </>
                    )}
                  </MessageContainer>
                  <ActionButtonsContainer>
                    <AppButton label="Create" type="primary" onClick={onClickAddRoom} disabled={validateCreate()} />
                  </ActionButtonsContainer>
                </Grid>
              </Grid>
            </AddCollapsible>
          </Grid>
        )}
        <Grid item container alignItems="center" sm={8}>
          <Subtitle>Rooms List</Subtitle>
        </Grid>
        <Grid item sm={4}>
          <AppInputSearch placeholder="Search" onChange={optimisedVersion} value={null} />
        </Grid>
        <Grid item xs={12}>
          <TableItems
            items={rooms.data}
            sortable
            onOpenEditModal={onOpenEditModal}
            onClickSorting={onClickSorting}
            isFetching={rooms.isFetching}
            tableQueryParams={tableQueryParams}
            isRegionView={false}
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
      <EditRoom open={editRoomOpen} onCloseEditModal={onCloseEditModal} roomToEdit={roomToEdit} getRooms={getRooms} />
    </Layout>
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

export default Room;
