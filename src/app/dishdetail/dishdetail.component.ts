import { Component, OnInit, Inject } from '@angular/core';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Dish } from '../shared/dish';
import { DishService } from '../services/dish.service';
import { Comment } from '../shared/comment';
import { visibility, flyInOut, expand } from '../animations/app.animation';

import 'rxjs/add/operator/switchMap';


@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  animations: [
    visibility(),
    flyInOut(),
    expand()
    ]
})

export class DishdetailComponent implements OnInit {

  dish: Dish;
  dishcopy = null;
  dishIds: number[];
  prev: number;
  next: number;
  addCommentForm: FormGroup;
  commentForm: Comment;
  errMess: string;
  visibility = 'shown';

  commentErrors = {
    'rating':   '',
    'comment':  '',
    'author':   '',
    'date':     '',
  };

  cmtValidateMsgs= {
    'comment': {
      'required': 'Comment information is required,'
    },
    'author': {
      'required':   'Author Name is required.',
      'minlength':  'Author name must be at least 2 characters long.'
    }
  };

  constructor(private dishservice: DishService,
              private route: ActivatedRoute,
              private location: Location,
              private commentEntry: FormBuilder,
              @Inject('BaseURL') private BaseURL) {
    this.createCommentForm();
  }

  createCommentForm(){
    this.addCommentForm = this.commentEntry.group({
      rating: 5,
      comment: ['', Validators.required],
      author: ['', [Validators.required, Validators.minLength(2)]],
      date: '',
    });

    this.addCommentForm.valueChanges
      .subscribe( data => this.onValueChanged(data) );

    this.onValueChanged();
  }

  onValueChanged(data?: any) {
    if (!this.addCommentForm) {
      return;
    }
    const form = this.addCommentForm;

    for (const field in this.commentErrors) {
      this.commentErrors[field] = '';
      const control = form.get(field);
      if (control && control.dirty && !control.valid){
        const messages = this.cmtValidateMsgs[field];
        for ( const key in control.errors ) {
          this.commentErrors[field] += messages[key] + ' ';
        }
      }
    }
  }

  ngOnInit() { // fetched url like:  /dishdetail/
    this.dishservice.getDishIds()
      .subscribe(dishIds => this.dishIds = dishIds);

    this.route.params
      .switchMap((params: Params) => { this.visibility = 'hidden'; return this.dishservice.getDish(+params['id']); })
      .subscribe( dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id); this.visibility = 'shown'; } ,
        errmess => { this.dish = null; this.errMess = <any>errmess; });
  }

  setPrevNext(dishId: number){
    let index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1)%this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1)%this.dishIds.length]
  }

  goBack(): void {
    this.location.back();
  }

  onSubmit() {

    var dateVar = new Date().toISOString();
    this.addCommentForm.patchValue({date: dateVar});
    //this.addCommentForm.value.date = dateVar;
    this.dishcopy.comments.push(this.addCommentForm.value);
    this.dishcopy.save()
      .subscribe(dish => this.dish = dish);
    this.addCommentForm.reset({
      'rating': 5,
      'comment':  '',
      'author':   '',
      'date':     ''
    });
  }
}
