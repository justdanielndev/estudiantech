import { Button as BaseButton } from '../ui/button';

export function Button(props: React.ComponentProps<typeof BaseButton>) {
  return <BaseButton {...props} />;
}
