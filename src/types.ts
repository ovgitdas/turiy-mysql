export type Tuple = {
  [key: string]: string | number;
};

export type InsertProps = {
  tableName: string;
  data: Tuple;
};

export type UpdateProps = {
  tableName: string;
  data: Tuple;
  where: string;
};

export type DeleteProps = {
  tableName: string;
  where: string;
};

export type User = {
  id: number;
  businessId: number;
  password: string;
  active: number;
};

export type UserCred = {
  userd: string;
  password: string;
};
