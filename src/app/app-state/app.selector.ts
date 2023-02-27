import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  lawcaseAdapter,
  LawcaseState,
  nodeAdapter,
  NodeState,
  OtherDataState,
  startAccountAdapter,
  StartAccountState
} from './app.reducer';

export const selectLawcaseState =
  createFeatureSelector<LawcaseState>('lawcase');

  /**所有案件 */
export const selector_lawcases = createSelector(
  selectLawcaseState,
  lawcaseAdapter.getSelectors().selectAll
);

/**案件entities */
export const selector_lawcaseEntities = createSelector(
  selectLawcaseState,
  lawcaseAdapter.getSelectors().selectEntities
);

export const selector_selectedLawcaseId = createSelector(
  selectLawcaseState,
  (state) => state.selectedId
);

/**当前选择的案件 */
export const selector_selectedLawcase = createSelector(
  selector_selectedLawcaseId,
  selector_lawcaseEntities,
  (id, entities) => id && entities[id]
);

//////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////startAccount selector//////////////////////////////////////////////////////

export const selectStartAccountState =
  createFeatureSelector<StartAccountState>('startAccount');

export const selector_startAccounts = createSelector(
  selectStartAccountState,
  startAccountAdapter.getSelectors().selectAll
);

export const selector_startAccountEntities = createSelector(
  selectStartAccountState,
  startAccountAdapter.getSelectors().selectEntities
);

export const selector_selectedStartAccountId = createSelector(
  selectStartAccountState,
  (state) => state.selectedId
);

export const selector_selectedStartAccount = createSelector(
  selector_selectedStartAccountId,
  selector_startAccountEntities,
  (id, entities) => entities[id]
);

export const selector_commonQueryDuration = createSelector(
  selector_selectedStartAccount,
  (acc) => acc?.commonQueryDuration
);

//////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////node selector//////////////////////////////////////////////////////

export const selectNodeState = createFeatureSelector<NodeState>('nodes');

export const selector_nodes = createSelector(
  selectNodeState,
  nodeAdapter.getSelectors().selectAll
);

export const selector_selectedNodeId = createSelector(
  selectNodeState,
  (state) => state.selectedId
);

export const selector_nodeEntities = createSelector(
  selectNodeState,
  nodeAdapter.getSelectors().selectEntities
);

export const selector_selectedNode = createSelector(
  selector_nodeEntities,
  selector_selectedNodeId,
  (entities, id) => id && entities[id]
);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////other selector///////////////////////////////////////////////////////////////

export const selectOtherDataState =
  createFeatureSelector<OtherDataState>('other');

export const selector_accountInfos = createSelector(
  selectOtherDataState,
  (state) => state.accountInfos
);

export const selector_accountRecord = createSelector(
  selectOtherDataState,
  (state) => state.record
);

// export const selector_persons = createSelector(
//   selectOtherDataState,
//   (state) => state.persons
// );

export const selector_relationRecords = createSelector(
  selectOtherDataState,
  (state) => state.relationRecordMap
);


export const selector_currentAccountInfo = createSelector(
  selectOtherDataState,
  (state) => state.currentAccountInfo
);

export const selector_appConfig = createSelector(
  selectOtherDataState,
  (state) => state.appConfig
);

export const selector_sues = createSelector(
  selector_appConfig,
  (appConfig) => appConfig.sues
);



// export const selector_isPersonExists = createSelector(
//   selectOtherDataState,
//   (state) => state.isPersonExists
// );

/**
 * 布局改变
 */
export const selector_layoutType = createSelector(
  selectOtherDataState,
  (state) => state.isLandscape
);

export const selector_user = createSelector(
  selectOtherDataState,
  (state) => state.user
);

/**
 * 是否是添加人员
 */
export const selector_isCreateUser = createSelector(
  selector_selectedStartAccount,
  selector_user,
  (acc,user)=>(acc?.userID == user?.id)
);

export const selector_countInfo = createSelector(
  selectOtherDataState,
  (state) => state.countInfo
);

