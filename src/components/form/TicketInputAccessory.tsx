import { Icon } from '@tlon/indigo-react';
import { AccessoryIcon, ToggleInput } from 'indigo-react';

import './TicketInputAccessory.scss';

export default function TicketInputAccessory({ name }: { name: any }) {
  return (
    <AccessoryIcon className="ticket-input-accessory">
      <ToggleInput
        name={name}
        className="mt1"
        inverseLabel={<Icon className="icon" icon="Visible" />}
        label={<Icon className="icon" icon="Hidden" />}
      />
    </AccessoryIcon>
  );
}
