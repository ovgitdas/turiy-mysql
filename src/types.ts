export type Tuple = {
  [key: string]: string | number;
};

export type Table = {
  [key: string]: Tuple;
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

export type Session = {
  user: Tuple;
  ip: string;
  agent: string;
};
