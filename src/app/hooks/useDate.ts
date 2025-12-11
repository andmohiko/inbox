import { useState } from "react"

export const useDate = () => {
  const [currentDate, setCurrentDate] = useState(new Date())

  return { currentDate, setCurrentDate }
}