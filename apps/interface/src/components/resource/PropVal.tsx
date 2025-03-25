import { useProperty, truncateUrl, type JSONValue } from "@tomic/react";
import ValueComp from "@components/resource/ValueComp";
import DefinitionLink from "@components/resource/definitionLink";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faTrashCan} from "@fortawesome/free-solid-svg-icons"
import { library } from "@fortawesome/fontawesome-svg-core";
library.add(faTrashCan);

type Props = {
  propertyURL?: string;
  value?: JSONValue;
  propertyLabel?: string;
  enableAction?: boolean;
};

/** A single Property / Value renderer that shows a label on the left, and the value on the right. The value is editable. */
function PropVal({ propertyURL, value, propertyLabel, enableAction = true }: Props) {
  // This hook converts a property URL into a full Property object with title, description and more.
  const property = useProperty(propertyURL!);
  // const truncated = truncateUrl(propertyURL!, 10, true);

  if (propertyURL === undefined) {
    return <div className="list-row">
    <div>
      <img className="size-10 rounded-box" src="/assets/component_icon.png"/>
    </div>
    <div>
      <>
          <div>
            {value?.toString()}
            <DefinitionLink className="ml-2" url={propertyURL} />
          </div>
          <div className="text-xs uppercase font-semibold opacity-60">
            {property.description}
        </div>
        </>
    </div>
    <button className="btn btn-square btn-ghost" disabled>
      <FontAwesomeIcon icon={faTrashCan} size='lg' color='#808080' />
    </button>
  </div>
  }

  return (
    <li className="list-row">
      <div>
        <img className="size-10 rounded-box" src="/assets/component_icon.png"/>
      </div>
      <div>
        {(propertyLabel !== undefined || property.error == undefined) ?
        <>
          <div>
            {propertyLabel ? propertyLabel : property.description}
            <DefinitionLink className="ml-2" url={propertyURL} />
          </div>
          <div className="text-xs uppercase font-semibold opacity-60">
            {/* <ValueComp value={value} datatype={property.datatype} /> */}
          </div>
          </> : <>
            <div>
              {value?.toString()}
              <DefinitionLink className="ml-2" url={propertyURL} />
            </div>
            <div className="text-xs uppercase font-semibold opacity-60">
              {property.description}
          </div>
          </>
        }
      </div>
      {enableAction &&
      <button className="btn btn-square btn-ghost">
        <FontAwesomeIcon icon={faTrashCan} size='lg' color='#808080' />
      </button>
      }
    </li>
  );
}

export default PropVal;
