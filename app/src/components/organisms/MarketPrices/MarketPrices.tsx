// MarketPrices organism: each resource's price and how it moved this turn.

import type { ReactElement } from "react";
import { useI18nContext } from "../../../i18n";
import type { MarketPrice } from "../../../types/game";
import { Swatch } from "../../atoms";
import { Change, Name, Price, Row, Rows } from "./MarketPrices.styles";

type MarketPricesProps = {
  prices: readonly MarketPrice[];
  look?: "rows" | "cards";
};

/** Resource prices with their change. */
export function MarketPrices({ prices, look = "rows" }: MarketPricesProps): ReactElement {
  const { LL, locale } = useI18nContext();
  const priceFormat = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const changeFormat = new Intl.NumberFormat(locale, { style: "percent", signDisplay: "always", maximumFractionDigits: 0 });

  return (
    <Rows>
      {prices.map((price) => (
        <Row key={price.resource} $look={look}>
          <Swatch color={{ resource: price.resource }} size="xs" shape="round" />
          <Name>{LL.resource[price.resource]()}</Name>
          <Price>{priceFormat.format(price.price)}</Price>
          <Change $isUp={price.change >= 0}>{changeFormat.format(price.change)}</Change>
        </Row>
      ))}
    </Rows>
  );
}
