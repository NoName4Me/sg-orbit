import { Checkbox } from "semantic-ui-react";
import { createChromaticSection, paramsBuilder, storiesOfBuilder } from "@utils";

function stories(segment) {
    return storiesOfBuilder(module, createChromaticSection("Checkbox"))
        .segment(segment)
        .parameters(paramsBuilder()
            .chromaticDelay(100)
            .build())
        .build();
}

stories()
    .add("default",
         () =>
             <>
                 <div className="flex">
                     <Checkbox label="Milky Way" />
                     <Checkbox checked label="Supernova" />
                     <Checkbox disabled label="Supernova" />
                     <Checkbox checked disabled label="Supernova" />
                 </div>
                 <div className="flex">
                     <Checkbox label="Milky Way" />
                     <Checkbox defaultIndeterminate checked label="Supernova" />
                     <Checkbox defaultIndeterminate disabled label="Supernova" />
                     <Checkbox defaultIndeterminate checked disabled label="Supernova" />
                 </div>
                 <div className="flex">
                     <Checkbox toggle />
                     <Checkbox checked toggle />
                     <Checkbox disabled toggle />
                     <Checkbox checked disabled toggle />
                 </div>
                 <div className="flex">
                     <Checkbox radio label="Meteor Shower" />
                     <Checkbox radio checked label="Meteor Shower" />
                     <Checkbox radio disabled label="Meteor Shower" />
                     <Checkbox radio checked disabled label="Meteor Shower" />
                 </div>
                 <div className="flex">
                     <Checkbox />
                     <Checkbox checked />
                     <Checkbox disabled />
                     <Checkbox checked disabled />
                 </div>
                 <div className="flex">
                     <Checkbox radio />
                     <Checkbox radio checked />
                     <Checkbox radio disabled />
                     <Checkbox radio checked disabled />
                 </div>
             </>
    );
