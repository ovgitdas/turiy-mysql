export type Tuple = {
  [key: string]: string | number
}

export type Table = {
  [key: string]: Tuple
}

export type Session = {
  user: Tuple
  ip: string
  agent: string
}
