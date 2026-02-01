import { Input as BaseInput } from '../ui/input';

export function Input(props: React.ComponentProps<typeof BaseInput>) {
  return <BaseInput {...props} />;
}
