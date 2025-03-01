import { useSessionStorage } from "@mantine/hooks"
const useMark = () => {
    const [storage, setStorage] = useSessionStorage({
        key: "marked-questions",
        defaultValue: [] as number[]
    })

    const isMarked = (id: number) => {
        return storage?.includes(id)
    }

    const mark = (id: number) => {
        if (storage === undefined) return null

        if (isMarked(id)) {
            return setStorage(storage?.filter((item) => item !== id) as any)
        }
        return setStorage([...storage, id])
    }

    const unmarkAll = () => {
        setStorage([])
    }

    return {
        storage,
        isMarked,
        mark,
        unmarkAll
    }

}
export default useMark