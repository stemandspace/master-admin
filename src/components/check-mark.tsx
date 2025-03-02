import useMark from '@/hooks/use-mark'
import { Checkbox } from './ui/checkbox'

interface CheckMarkProps {
  id: number
  row:any
}

const CheckMark: React.FC<CheckMarkProps> = ({ id ,row}) => {
  const { isMarked, mark } = useMark()
  return (
    <div>
      {/* <button onClick={() => mark(id)}>
        {isMarked(id) ? 'Unmark' : 'Mark'}
      </button> */}

      <Checkbox
        checked={isMarked(id)}
        onCheckedChange={(value) => {
          row.toggleSelected(!!value)
          mark(id)}}
        aria-label='Mark'
      />
    </div>
  )
}

export default CheckMark
