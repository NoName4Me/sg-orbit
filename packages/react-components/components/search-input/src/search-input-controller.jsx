import { AutoControlledPureComponent, DOMEventListener, KEYS, getAutoControlledStateFromProps, isNullOrEmpty, mergeClasses, withHandlerProxy } from "@orbit-ui/react-components-shared";
import { Button } from "@orbit-ui/react-button";
import { CloseIcon24, MagnifierIcon } from "@orbit-ui/icons";
import { DEFAULT_SIZE, SIZES } from "./sizes";
import { Input } from "@orbit-ui/react-input";
import { RESULT_SHAPE } from "./results";
import { Search } from "semantic-ui-react";
import { arrayOf, bool, func, node, number, oneOf, shape, string } from "prop-types";
import { createRef } from "react";
import { debounce, isEmpty, isFunction, isNil } from "lodash";
import cx from "classnames";

function defaultResultRenderer({ text }) {
    return <div data-testid="search-input-result">{text}</div>;
}

export class SearchInputController extends AutoControlledPureComponent {
    static propTypes = {
        open: bool,
        results: arrayOf(shape(RESULT_SHAPE)).isRequired,
        value: string,
        defaultValue: string,
        onValueChange: func.isRequired,
        onSearch: func.isRequired,
        onClear: func,
        // eslint-disable-next-line react/no-unused-prop-types
        onFocus: func,
        onBlur: func,
        onKeyDown: func,
        onOutsideClick: func,
        resultRenderer: func,
        clearOnSelect: bool,
        noResultsMessage: string,
        minCharacters: number,
        placeholder: string,
        debounceDelay: number,
        loading: bool,
        icon: node,
        clearIcon: node,
        disabled: bool,
        autofocus: bool,
        autofocusDelay: number,
        fluid: bool,
        size: oneOf(SIZES),
        className: string
    };

    static defaultProps = {
        resultRenderer: defaultResultRenderer,
        clearOnSelect: false,
        minCharacters: 1,
        placeholder: "Search",
        debounceDelay: 200,
        loading: false,
        icon: <MagnifierIcon />,
        clearIcon: <CloseIcon24 />,
        disabled: false,
        autofocus: false,
        autofocusDelay: 50,
        size: DEFAULT_SIZE,
        fluid: false
    };

    static autoControlledProps = ["value"];

    state = {
        transformedResults: [],
        value: null,
        query: null,
        renderPropagationFix: !this.props.disabled
    };

    _containerRef = createRef();
    _inputRef = createRef();
    _clearButtonRef = createRef();

    componentDidMount() {
        this.transformResults();
    }

    componentDidUpdate(prevProps) {
        const { results } = this.props;

        // This seems like a good opportunity to use "getDerivedStateFromProps" instead of "componentDidUpdate" to compute the transformed results.
        // It might not be since the shallow comparison of the results array will mostly returns false since the array reference will usually be different.
        // Knowing this, we will mostly end up transforming the results before EVERY render if we use "getDerivedStateFromProps".
        if (prevProps.results !== results) {
            this.transformResults();
        }
    }

    componentWillUnmount() {
        this.cancelOnSearchDebounce();
    }

    static getDerivedStateFromProps(props, state) {
        return getAutoControlledStateFromProps(props, state, SearchInputController.autoControlledProps, ({ value }) => ({
            query: isNil(value) ? "" : value
        }));
    }

    transformResults() {
        const { results } = this.props;

        // YES, this is a weird hack.
        // Why do we do this? The current version of the search component render all the props that are not "title", "description", "price" or "image"
        // as a data properties on the result DOM elements.
        // Rendering those data properties generates a lot of React errors. React doesn't understand why he have to render a data properties called "userId" or "tenantId".
        // Until this is fixed, the solution is to provide all our custom properties as a JSON serialized string through the "description" property.
        // The issue for this matter is: https://github.com/Semantic-Org/Semantic-UI-React/issues/1141
        const transformedResults = results.map(x => ({
            title: x.text,
            description: JSON.stringify(x)
        }));

        this.setState({ transformedResults: transformedResults });
    }

    handleResultSelect = (event, data) => {
        const { clearOnSelect, onValueChange } = this.props;

        const selectedResult = JSON.parse(data.result.description);

        if (clearOnSelect) {
            this.trySetAutoControlledStateValue({ value: null });
            this.setState({ query: "" });
        } else {
            this.trySetAutoControlledStateValue({ value: selectedResult.text });
            this.setState({ query: selectedResult.text });
        }

        onValueChange(event, selectedResult, this.props);
    };

    handleSearchChange = (event, data) => {
        this.setState({ query: data.value });

        if (!isNil(this.onSearch)) {
            this.onSearch(event, data.value, this.props);
        }
    };

    handleBlur = event => {
        const { onBlur, disabled } = this.props;

        const afterHandlingBlur = () => {
            if (!disabled) {
                this.setState({ renderPropagationFix: true });
            }

            if (!isNil(onBlur)) {
                onBlur(event, this.props);
            }
        };

        if (!this._clearButtonRef.current.contains(event.relatedTarget)) {
            // Without a defered execution the selected value is always different than the typed value.
            setTimeout(() => {
                const { value, query } = this.state;

                if (isNil(value)) {
                    if (!isNullOrEmpty(query)) {
                        // When the user modified the query but didn't select any result and we dont know of any selected result, clear everything.
                        this.trySetAutoControlledStateValue({ value: null });
                        this.setState({ query: "" });
                    }
                } else {
                    // When the user modified the query but didn't select any result, reset the query to the last known selected result.
                    if (value !== query) {
                        this.setState({ query: value });
                    }
                }

                afterHandlingBlur();
            }, 0);
        } else {
            afterHandlingBlur();
        }
    };

    handleFocus = withHandlerProxy(this, "onFocus");

    handleClear = event => {
        const { onClear } = this.props;

        this.clear(event);

        if (!isNil(onClear)) {
            onClear(event, this.props);
        }
    };

    handleInputKeyDown = event => {
        const { onKeyDown } = this.props;

        switch (event.keyCode) {
            case KEYS.enter:
                this.handleInputEnter(event);
                break;
            case KEYS.esc:
                this.handleInputEscape(event);
                break;
        }

        if (!isNil(onKeyDown)) {
            onKeyDown(event, this.props);
        }
    };

    handleInputEnter = event => {
        const { loading } = this.props;
        const { query } = this.state;

        if (!loading) {
            if (isNullOrEmpty(query)) {
                this.clear(event);
            }
        }
    };

    handleInputEscape = event => {
        const { open } = this.props;

        if (!open) {
            this.clear(event);
        }
    };

    onSearch = this.props.debounceDelay !== 0 ? debounce(this.props.onSearch, this.props.debounceDelay, { leading: true }) : this.props.onSearch;

    handleDocumentClick = event => {
        const { onOutsideClick } = this.props;

        if (!isNil(onOutsideClick)) {
            if (this._containerRef.current) {
                if (!this._containerRef.current.contains(event.target)) {
                    onOutsideClick(event, this.props);
                }
            }
        }
    };

    cancelOnSearchDebounce() {
        if (isFunction(this.onSearch.cancel)) {
            this.onSearch.cancel();
        }
    }

    clear(event) {
        const { onValueChange } = this.props;
        const { value, query } = this.state;

        if (!isNullOrEmpty(query)) {
            this.setState({ query: "" });
        }

        if (!isNil(value)) {
            this.trySetAutoControlledStateValue({ value: null });

            onValueChange(event, null, this.props);
        }
    }

    canClear() {
        const { disabled } = this.props;
        const { query } = this.state;

        return !isEmpty(query) && !disabled;
    }

    getContainerClasses() {
        const { fluid, className } = this.props;

        return mergeClasses(
            "search-input relative",
            !fluid && "inline-flex",
            className
        );
    }

    renderResult = result => {
        const { resultRenderer } = this.props;

        const data = JSON.parse(result.description);

        return resultRenderer(data, this.props);
    };

    renderInput = () => {
        const { open, loading, icon, disabled, autofocus, autofocusDelay, size, fluid } = this.props;

        return <Input
            icon={icon}
            iconPosition="left"
            onKeyDown={this.handleInputKeyDown}
            loading={loading && !disabled}
            autofocus={open || autofocus}
            autofocusDelay={open ? undefined : autofocusDelay}
            disabled={disabled}
            size={size}
            fluid={fluid}
            ref={this._inputRef}
            data-testid="search-input-textbox"
        />;
    }

    renderClearButton = () => {
        const { clearIcon } = this.props;

        return (
            <div className={cx("clear-btn-container absolute", { dn: !this.canClear() })}>
                <Button
                    ghost
                    secondary
                    icon={clearIcon}
                    size="tiny"
                    className="transparent"
                    onClick={this.handleClear}
                    type="button"
                    ref={this._clearButtonRef}
                    data-testid="search-input-clear-button"
                />

                <style jsx>{`
                    .clear-btn-container {
                        top: 50%;
                        transform: translateX(50%) translateY(-50%);
                        right: var(--scale-echo)
                    }
                `}</style>
            </div>
        );
    };

    render() {
        const { open, loading, disabled, noResultsMessage, minCharacters, placeholder, fluid } = this.props;
        const { transformedResults, query } = this.state;

        return (
            <>
                <div className={this.getContainerClasses()} ref={this._containerRef}>
                    <Search
                        open={open && !disabled}
                        minCharacters={minCharacters}
                        noResultsMessage={noResultsMessage}
                        onResultSelect={this.handleResultSelect}
                        onSearchChange={this.handleSearchChange}
                        onBlur={this.handleBlur}
                        resultRenderer={this.renderResult}
                        results={transformedResults}
                        value={query}
                        input={this.renderInput()}
                        placeholder={placeholder}
                        disabled={disabled}
                        tabIndex={disabled ? "-1" : "0"}
                        loading={loading && !disabled}
                        fluid={fluid}
                    />
                    {this.renderClearButton()}

                    <style jsx>{`
                        .search-input.search-input :global(.prompt) {
                            padding-right: var(--scale-juliett) !important;
                        }
                    `}</style>
                </div>

                <If condition={open}>
                    <DOMEventListener name="click" on={this.handleDocumentClick} />
                </If>
            </>
        );
    }
}
