// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

using Microsoft.AspNetCore.Razor.TagHelpers;

namespace ClearUITagHelpers
{
    [HtmlTargetElement("cui-textbox", TagStructure = TagStructure.NormalOrSelfClosing)]
    [HtmlTargetElement("cui-textarea", TagStructure = TagStructure.NormalOrSelfClosing)]
    [HtmlTargetElement("cui-checkbox", TagStructure = TagStructure.NormalOrSelfClosing)]
    [HtmlTargetElement("cui-checkbox-grp", TagStructure = TagStructure.NormalOrSelfClosing)]
    [HtmlTargetElement("cui-radio-btn", TagStructure = TagStructure.NormalOrSelfClosing)]
    [HtmlTargetElement("cui-radio-grp", TagStructure = TagStructure.NormalOrSelfClosing)]
    [HtmlTargetElement("cui-switch", TagStructure = TagStructure.NormalOrSelfClosing)]
    [HtmlTargetElement("cui-dropdown", TagStructure = TagStructure.NormalOrSelfClosing)]
    [HtmlTargetElement("cui-tree-list", TagStructure = TagStructure.NormalOrSelfClosing)]
    public class InputControlTagHelper:BaseVueInputTagHelper
    {
        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            base.Process(context, output);
            if (AspFor != null)
            {
                if (!hasVModel)
                {
                    var vmodel = FormatModelName(AspFor.Name);
                    if (IsLazy)
                        output.Attributes.SetAttribute("v-model.lazy", vmodel);
                    else
                        output.Attributes.SetAttribute("v-model", vmodel);
                }
                //Set up id attribute
                if (!hasId)
                {
                    output.Attributes.SetAttribute("id", FormatModelName(AspFor.Name));
                }
                //Set up name attribute
                if (!hasName)
                {
                    output.Attributes.SetAttribute("name", FormatModelName(AspFor.Name));
                }
                //Set up label attribute
                if (!hasLabel)
                {
                    output.Attributes.SetAttribute("label", FormatModelName(AspFor.Metadata.DisplayName ?? AspFor.Name));
                }
            }
            
            
        }
    }
}
