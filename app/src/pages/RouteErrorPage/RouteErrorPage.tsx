// Route error page: shown when a page fails to load or the URL doesn't match any route.

import type { ReactElement } from "react";
import { Button, Heading, Text } from "../../components/atoms";
import { PageContainer } from "../../components/templates";
import { useI18nContext } from "../../i18n";
import { paths } from "../../routes/paths";

/** Friendly error with a way back to the lobbies. */
export function RouteErrorPage(): ReactElement {
  const { LL } = useI18nContext();
  return (
    <PageContainer>
      <Heading level={1}>{LL.routeError.title()}</Heading>
      <Text tone="muted">{LL.routeError.body()}</Text>
      <div>
        <Button to={paths.home}>{LL.routeError.home()}</Button>
      </div>
    </PageContainer>
  );
}
