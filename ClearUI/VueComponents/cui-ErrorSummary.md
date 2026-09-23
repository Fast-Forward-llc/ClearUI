# <cui-error-summary>

A component for displaying a summary of validation errors, with accessible navigation and customizable heading.

## Usage

```vue
<cui-error-summary
  heading="Please fix the following errors:"
  heading-level="h2"
  :errors="errorListInstance"
/>
```

## Props

| Name         | Type      | Default | Description                                                      |
|--------------|-----------|---------|------------------------------------------------------------------|
| heading      | String    | —       | Optional heading text to display above the error list.           |
| headingLevel | String    | `h2`    | HTML heading level for the heading (e.g., 'h2', 'h3').           |
| errors       | ErrorList | —       | The ErrorList instance containing validation errors.              |

## Events

| Event Name | Payload | Description                                 |
|------------|---------|---------------------------------------------|
| click      | event   | Emitted when an error link is clicked.      |

## Slots

- **default**: Custom rendering for the error list. Receives slot prop: `errors` (the ErrorList instance).

## Features

- Renders a summary of errors as a list of links, each linking to the associated control by `ctrlId`.
- Accessible: uses `role="status"` and supports custom heading levels.
- Listens for `SetErrorMsg` and `ClearErrorMsg` events to update the error list dynamically.
- Emits a `click` event when an error link is clicked, passing the error info in `event.errorInfo`.
- Supports custom rendering of the error list via the default slot.

## Example

```vue
<cui-error-summary
  heading="Please fix the following errors:"
  heading-level="h2"
  :errors="myErrorList"
/>
```

Or with a custom slot:

```vue
<cui-error-summary :errors="myErrorList">
  <template #default="{ errors }">
  <ol>
    <li v-for="i in errors.items" :key="i.msgId">
      <a :href="'#' + i.ctrlId">{{ i.msg }}</a>
    </li>
  </ol>
  </template>
</cui-error-summary>
```

Example of `ErrorSummary` passed an `ErrorList` that is capturing bubbled `error` events

```vue
<div v-on:error="AddError">
    <h1>Error Summary Test</h1>
    <div class="text-center">
        <div class="row">
            <div class="col-12">
                <cui-error-summary :errors="errorList" heading="Error Summary">
                </cui-error-summary>
            </div>
        </div>
        <div class="row">
            <div class="col-2" id="tbox1">
                <cui-textbox label="Textbox" v-model="testVar1" placeholder="placeholder" :required="true" >
                    <template v-slot="ctrl">
                        <cui-valmsg :expr="$vFn.isRequired(ctrl?.value)" msg="Field is Required." :trigger-on="ctrl.validateTrigger+ctrl?.value" :priority="99"></cui-valmsg>
                        <cui-valmsg :expr="$vFn.isNumber(ctrl?.value)" msg="Must be Numeric." :trigger-on="ctrl.validateTrigger+ctrl?.value"></cui-valmsg>
                    </template>
                </cui-textbox>
            </div>
        </div>
        <div class="row">
            <div class="col-2">
                <!-- some stand-alone validation not nested in an input component --!>
                <cui-valmsg :expr="$vFn.isRequired(sampleVar2)" msg="Sample value is Required." :trigger-on="sampleVar2"></cui-valmsg>
            >/div>
        </div>
    </div>
</div>
<script>
    import {jsUtils} from 'ClearUI'
    const pageComponent = {
        methods:{
            AddError(err){
                this.errorList.addError(err)
            }
        },
        created(){
            this.errorList = new jsUtils.ErrorList();
        }
    }
</script>
```

In the above example snippet a top level `error` handler is receiving bubbled `error` events and adding them to a local instance of ErrorList.
 `errorList` is passed as a prop to the error summary. The error summary lists all errors accumulated in the ErrorList. Because the ErroList is 
 handling bubbled DOM events it doe snot need a direct parent relationship with the input components to receive error events. In addition it receives
  error messages for all component and sub component input and stand-alone valmsg components nested inside the top level element.
 