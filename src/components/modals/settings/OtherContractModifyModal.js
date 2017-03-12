import React, {Component} from 'react';
import {connect} from 'react-redux';
import IconButton from 'material-ui/IconButton';
import NavigationClose from 'material-ui/svg-icons/navigation/close';
import {Dialog, FlatButton, RaisedButton} from 'material-ui';
import styles from '../styles';
import {saveContractSettings} from '../../../redux/ducks/settings/otherContracts';
import AbstractOtherContractModel from '../../../models/contracts/AbstractOtherContractModel';

const mapStateToProps = (state) => ({
    contract: state.get('settingsOtherContracts').selected, /** @see AbstractOtherContractModel **/
});

const mapDispatchToProps = (dispatch) => ({
    save: (contract: AbstractOtherContractModel) =>
        dispatch(saveContractSettings(contract, localStorage.getItem('chronoBankAccount')))
});

@connect(mapStateToProps, mapDispatchToProps)
class OtherContractModifyModal extends Component {
    handleSubmit = (values) => {
        this.props.save(this.props.contract.set('settings', values.toJS()));
        this.handleClose();
    };

    handleSubmitClick = () => {
        this.refs.OtherContractModifyForm.getWrappedInstance().submit();
    };

    handleClose = () => {
        this.props.hideModal();
    };

    render() {
        const {open} = this.props;
        const form = this.props.contract.form('OtherContractModifyForm', this.handleSubmit);
        const actions = form === null ? [<FlatButton label="Close" onTouchTap={this.handleClose}/>]
            : [
                <FlatButton
                    label="Cancel"
                    onTouchTap={this.handleClose}
                />,
                <RaisedButton
                    label={'Save'}
                    primary={true}
                    onTouchTap={this.handleSubmitClick.bind(this)}
                />,
            ];

        return (
            <Dialog
                title={<div>
                    {'Modify ' + this.props.contract.name() + ' contract'}
                    <IconButton style={styles.close} onTouchTap={this.handleClose}><NavigationClose /></IconButton>
                </div>}
                actions={actions}
                actionsContainerStyle={styles.container}
                titleStyle={styles.title}
                modal={true}
                open={open}>

                {form === null ? 'This contract has no settings.' : form}

            </Dialog>
        );
    }
}

export default OtherContractModifyModal;