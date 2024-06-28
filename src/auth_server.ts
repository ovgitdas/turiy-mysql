import { select } from "./mysql_server"
import { cookies } from "next/headers"
import { getClientIP, getUserAgent } from "./util"
import { getSession, getSessionFor, setSession } from "./session_server"
import { Table, Tuple } from "./types"

//? eg. signin({user:{id:'my-user-id', password:"my-password"}})
export const signin = async (userTable: Table): Promise<Tuple | undefined> => {
  const res = await select(userTable)
  if (res.length > 0 && res[0].active) {
    setSession({
      user: res[0],
      agent: getUserAgent(),
      ip: getClientIP(),
    })
    return res[0]
  }
}

export const signout = () => cookies().delete("session")

export const authCheck = async (): Promise<Tuple | undefined> => {
  const session = await getSession()
  const agent = getUserAgent()
  const ip = getClientIP()
  return session && session.user && session.agent === agent && session.ip === ip
    ? session.user
    : undefined
}

export const authCheckFor = async (
  sessionCipher: string,
  ip: string,
  agent: string
): Promise<Tuple | undefined> => {
  const session = await getSessionFor(sessionCipher)
  return session && session.user && session.agent === agent && session.ip === ip
    ? session.user
    : undefined
}
