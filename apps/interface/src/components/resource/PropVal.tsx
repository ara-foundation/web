import { useProperty, truncateUrl, type JSONValue } from "@tomic/react";
import { useContext } from "react";
import { AppContext } from "@scripts/atomicServer";
import ValueComp from "@components/resource/ValueComp";

type Props = {
  propertyURL: string;
  value: JSONValue;
};

/** A single Property / Value renderer that shows a label on the left, and the value on the right. The value is editable. */
function PropVal({ propertyURL, value }: Props) {
  // This hook converts a property URL into a full Property object with title, description and more.
  const property = useProperty(propertyURL);
  const truncated = truncateUrl(propertyURL, 10, true);
  const { setSubject } = useContext(AppContext);

  return (
    <div>
      <h3 title={property.description}>
        <a
          href={propertyURL}
          onClick={(e) => {
            e.preventDefault();
            setSubject(propertyURL);
          }}
        >
          {property.error ? (
            <span>{truncated}</span>
          ) : (
            property.shortname || truncated
          )}
        </a>
        :
      </h3>
      <ValueComp value={value} datatype={property.datatype} />
    </div>
  );
}

export default PropVal;
