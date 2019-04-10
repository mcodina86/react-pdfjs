import React from "react";
import SvgBase from "./SvgBase";

const Zoomout = props => {
  const scale = props.scale || 1;
  const color = props.color || "#ff0000";

  return (
    <SvgBase width="32" height="32" scale={scale}>
      <path
        d="m14.102 11.518v3h10.713v-3zm-4.204 7.7418c-1.3724 0.05119-2.1152 1.3607-3.0838 2.1482-1.9459 1.8727-3.9095 3.7274-5.8442 5.6114-1.6648 1.8867 1.1337 5.1509 3.2533 3.8323 2.5879-2.3629 5.0736-4.8459 7.6212-7.2562 1.4595-1.4473 0.01679-4.3568-1.9466-4.3358zm9.4911-18.414c-5.6111-0.10132-10.867 4.2095-11.911 9.7151-1.1632 5.2041 1.6175 10.911 6.3859 13.268 4.7157 2.5223 10.995 1.359 14.516-2.6583 3.6677-3.8894 4.2132-10.259 1.2455-14.709-2.1786-3.4429-6.1547-5.652-10.237-5.6158zm0 4.017c3.9771-0.097784 7.6613 3.1428 8.0691 7.1003 0.581 3.8676-2.0405 7.8847-5.8329 8.8687-3.7484 1.1387-8.1223-0.85276-9.662-4.4685-1.7068-3.609-0.27459-8.3268 3.1943-10.327 1.2674-0.77093 2.749-1.1769 4.2316-1.1735z"
        fill={color}
      />
    </SvgBase>
  );
};

export default Zoomout;
