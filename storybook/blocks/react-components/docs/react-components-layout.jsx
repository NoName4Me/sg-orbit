import { BrandPicker, CornerGithubLink, SemanticLink } from "@blocks";
import { isNil } from "lodash";
import { string } from "prop-types";

const propTypes = {
    sourcePath: string,
    semanticPath: string
};

export function ReactComponentsLayout({ sourcePath, semanticPath, children }) {
    return (
        <>
            <BrandPicker />
            {!isNil(sourcePath) && <CornerGithubLink path={sourcePath} />}
            {!isNil(semanticPath) && <SemanticLink path={semanticPath} />}
            {children}
        </>
    );
}

ReactComponentsLayout.propTypes = propTypes;
