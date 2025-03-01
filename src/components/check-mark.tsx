import useMark from '@/hooks/use-mark'
import { Checkbox } from './ui/checkbox'

interface CheckMarkProps {
  id: number
}

const CheckMark: React.FC<CheckMarkProps> = ({ id }) => {
  const { isMarked, mark } = useMark()
  return (
    <div>
      {/* <button onClick={() => mark(id)}>
        {isMarked(id) ? 'Unmark' : 'Mark'}
      </button> */}

      <Checkbox
        checked={isMarked(id)}
        onCheckedChange={() => mark(id)}
        aria-label='Mark'
      />
    </div>
  )
}

export default CheckMark
